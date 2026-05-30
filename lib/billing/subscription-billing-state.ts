import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyUserBillingStripePatch } from "@/lib/billing/apply-user-billing-state";
import { isPaidPlanType, type PaidPlanType } from "@/lib/billing/paid-plan-type";

function periodEndIso(sub: Stripe.Subscription): string | null {
  let end = (sub as { current_period_end?: number }).current_period_end;
  if (typeof end !== "number" || !Number.isFinite(end)) {
    const itemEnd = sub.items?.data?.[0]?.current_period_end;
    end = typeof itemEnd === "number" ? itemEnd : undefined;
  }
  if (typeof end !== "number" || !Number.isFinite(end)) return null;
  return new Date(end * 1000).toISOString();
}

function subscriptionAutoRenew(sub: Stripe.Subscription): boolean {
  if (sub.status === "canceled" || sub.status === "unpaid") return false;
  if (sub.cancel_at_period_end) return false;
  return sub.status === "active" || sub.status === "trialing";
}

function subscriptionIsProActive(sub: Stripe.Subscription): boolean {
  return sub.status === "active" || sub.status === "trialing";
}

export async function resolveUserIdFromSubscription(
  supabase: SupabaseClient,
  sub: Stripe.Subscription,
): Promise<string | null> {
  const metaUid =
    typeof sub.metadata?.user_id === "string" ? sub.metadata.user_id.trim() : "";
  if (metaUid) return metaUid;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  if (!customerId) return null;

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return typeof data?.id === "string" ? data.id : null;
}

export async function applySubscriptionState(
  supabase: SupabaseClient,
  userId: string,
  sub: Stripe.Subscription,
  planType: PaidPlanType,
  options?: { grantWhileIncomplete?: boolean },
): Promise<void> {
  const active =
    subscriptionIsProActive(sub) ||
    (options?.grantWhileIncomplete === true && sub.status === "incomplete");
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

  await applyUserBillingStripePatch(supabase, userId, {
    paid_plan_active: active,
    paid_plan_type: active ? planType : null,
    paid_plan_period_end_at: active ? periodEndIso(sub) : null,
    paid_plan_auto_renew: active ? subscriptionAutoRenew(sub) : false,
    stripe_customer_id: customerId,
    stripe_subscription_id: active ? sub.id : null,
  });
}

export async function handleStripeSubscriptionUpdated(
  supabase: SupabaseClient,
  sub: Stripe.Subscription,
): Promise<void> {
  const userId = await resolveUserIdFromSubscription(supabase, sub);
  if (!userId) return;

  const planRaw = sub.metadata?.plan;
  let planType: PaidPlanType | null = isPaidPlanType(planRaw) ? planRaw : null;
  if (!planType) {
    const { data } = await supabase
      .from("users")
      .select("paid_plan_type")
      .eq("id", userId)
      .maybeSingle();
    planType = isPaidPlanType(data?.paid_plan_type) ? data.paid_plan_type : "monthly";
  }

  await applySubscriptionState(supabase, userId, sub, planType);
}

export async function handleStripeSubscriptionDeleted(
  supabase: SupabaseClient,
  sub: Stripe.Subscription,
): Promise<void> {
  const userId = await resolveUserIdFromSubscription(supabase, sub);
  if (!userId) return;

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

  await applyUserBillingStripePatch(supabase, userId, {
    paid_plan_active: false,
    paid_plan_type: null,
    paid_plan_period_end_at: null,
    paid_plan_auto_renew: false,
    stripe_customer_id: customerId,
    stripe_subscription_id: null,
  });
}

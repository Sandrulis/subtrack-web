import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyUserBillingStripePatch } from "@/lib/billing/apply-user-billing-state";
import { isPaidPlanType, type PaidPlanType } from "@/lib/billing/paid-plan-type";
import { isStripeConfigured } from "@/lib/billing/stripe-env";
import { getStripeServerClient } from "@/lib/billing/stripe-server";
import { applySubscriptionState } from "@/lib/billing/subscription-billing-state";
import { checkoutSessionPaymentSettled } from "@/lib/billing/checkout-session-utils";

export type SyncUserBillingFromStripeResult =
  | {
      ok: true;
      paid_plan_active: boolean;
      paid_plan_type: PaidPlanType | null;
      source: "subscription" | "lifetime" | "cleared";
    }
  | { ok: false; message: string };

function planFromSubscription(sub: {
  metadata?: { plan?: string } | null;
}): PaidPlanType {
  const meta = sub.metadata?.plan;
  return isPaidPlanType(meta) ? meta : "monthly";
}

function pickActiveSubscription(
  subs: Stripe.Subscription[],
): Stripe.Subscription | null {
  const rank = (status: string) => {
    if (status === "active") return 0;
    if (status === "trialing") return 1;
    return 99;
  };
  const eligible = subs.filter((s) => s.status === "active" || s.status === "trialing");
  if (!eligible.length) return null;
  eligible.sort((a, b) => rank(a.status) - rank(b.status) || b.created - a.created);
  return eligible[0] ?? null;
}

/**
 * Admin / support: sinhronizē `paid_plan_*` no **pašreizējā** Stripe stāvokļa.
 * Neizmanto Checkout `session_id` (nav replay ar veco sesiju pēc atcelšanas).
 */
export async function syncUserBillingFromStripe(
  supabase: SupabaseClient,
  userId: string,
): Promise<SyncUserBillingFromStripeResult> {
  if (!isStripeConfigured()) {
    return { ok: false, message: "stripe_not_configured" };
  }

  const stripe = getStripeServerClient();
  if (!stripe) {
    return { ok: false, message: "stripe_not_configured" };
  }

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select(
      "stripe_customer_id, pro_vip, paid_plan_type",
    )
    .eq("id", userId)
    .maybeSingle();

  if (userErr) {
    return { ok: false, message: userErr.message };
  }
  if (!user) {
    return { ok: false, message: "user_not_found" };
  }

  if (user.pro_vip === true) {
    return { ok: false, message: "user_is_vip" };
  }

  const customerId =
    typeof user.stripe_customer_id === "string" ? user.stripe_customer_id.trim() : "";
  if (!customerId) {
    return { ok: false, message: "no_stripe_customer" };
  }

  const subList = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 30,
  });

  const activePick = pickActiveSubscription(subList.data);
  if (activePick) {
    const sub = await stripe.subscriptions.retrieve(activePick.id);
    const planType = planFromSubscription(sub);
    await applySubscriptionState(supabase, userId, sub, planType);

    const { data: row } = await supabase
      .from("users")
      .select("paid_plan_active, paid_plan_type")
      .eq("id", userId)
      .maybeSingle();

    return {
      ok: true,
      paid_plan_active: row?.paid_plan_active === true,
      paid_plan_type: isPaidPlanType(row?.paid_plan_type) ? row.paid_plan_type : planType,
      source: "subscription",
    };
  }

  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 30,
  });

  const lifetimeSession = sessions.data.find(
    (s) =>
      s.mode === "payment" &&
      s.status === "complete" &&
      checkoutSessionPaymentSettled(s) &&
      s.metadata?.plan === "lifetime",
  );

  if (lifetimeSession) {
    await applyUserBillingStripePatch(supabase, userId, {
      paid_plan_active: true,
      paid_plan_type: "lifetime",
      paid_plan_period_end_at: null,
      paid_plan_auto_renew: false,
      stripe_customer_id: customerId,
      stripe_subscription_id: null,
    });
    return {
      ok: true,
      paid_plan_active: true,
      paid_plan_type: "lifetime",
      source: "lifetime",
    };
  }

  await applyUserBillingStripePatch(supabase, userId, {
    paid_plan_active: false,
    paid_plan_type: null,
    paid_plan_period_end_at: null,
    paid_plan_auto_renew: false,
    stripe_customer_id: customerId,
    stripe_subscription_id: null,
  });

  return {
    ok: true,
    paid_plan_active: false,
    paid_plan_type: null,
    source: "cleared",
  };
}

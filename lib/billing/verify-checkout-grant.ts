import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyUserBillingStripePatch,
  incrementLifetimePurchaseCount,
} from "@/lib/billing/apply-user-billing-state";
import {
  checkoutSessionPaymentSettled,
  resolveCheckoutSessionUserId,
} from "@/lib/billing/checkout-session-utils";
import { isPaidPlanType, type PaidPlanType } from "@/lib/billing/paid-plan-type";
import { getStripeServerClient } from "@/lib/billing/stripe-server";
import { applySubscriptionState } from "@/lib/billing/subscription-billing-state";

export function checkoutSessionIsComplete(session: Stripe.Checkout.Session): boolean {
  return session.status === "complete";
}

function subscriptionQualifiesForGrant(
  sub: Stripe.Subscription,
  allowIncompleteSubscription: boolean,
): boolean {
  if (sub.status === "active" || sub.status === "trialing") return true;
  if (allowIncompleteSubscription && sub.status === "incomplete") return true;
  return false;
}

export type GrantProFromCheckoutOptions = {
  /** Tikai `checkout.session.completed` / īss logs pēc maksājuma – nevis sync replay pēc atcelšanas. */
  allowIncompleteSubscription: boolean;
};

/**
 * Ieslēdz Pro tikai, ja Stripe Checkout sesija ir pabeigta un apmaksāta.
 * Abonementam obligāti pārbauda Stripe Subscription statusu (novērš veca `cs_` replay).
 */
export async function grantProFromCheckoutSession(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  options: GrantProFromCheckoutOptions,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = resolveCheckoutSessionUserId(session);
  if (!userId) {
    return { ok: false, message: "missing_user_id" };
  }

  if (!checkoutSessionIsComplete(session)) {
    return { ok: false, message: "session_not_complete" };
  }

  if (!checkoutSessionPaymentSettled(session)) {
    return { ok: false, message: "payment_not_completed" };
  }

  const planRaw = session.metadata?.plan;
  const plan: PaidPlanType | null = isPaidPlanType(planRaw) ? planRaw : null;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  if (session.mode === "payment" && plan === "lifetime") {
    await applyUserBillingStripePatch(supabase, userId, {
      paid_plan_active: true,
      paid_plan_type: "lifetime",
      paid_plan_period_end_at: null,
      paid_plan_auto_renew: false,
      stripe_customer_id: customerId,
      stripe_subscription_id: null,
    });
    await incrementLifetimePurchaseCount(supabase);
    return { ok: true };
  }

  if (session.mode === "subscription" && plan) {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;

    if (!subId) {
      return { ok: false, message: "subscription_missing" };
    }

    const stripe = getStripeServerClient();
    if (!stripe) {
      return { ok: false, message: "stripe_not_configured" };
    }

    let sub: Stripe.Subscription;
    try {
      sub = await stripe.subscriptions.retrieve(subId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "subscription_fetch_failed";
      return { ok: false, message: msg };
    }

    if (!subscriptionQualifiesForGrant(sub, options.allowIncompleteSubscription)) {
      return { ok: false, message: "subscription_not_active" };
    }

    await applySubscriptionState(supabase, userId, sub, plan, {
      grantWhileIncomplete:
        options.allowIncompleteSubscription && sub.status === "incomplete",
    });
    return { ok: true };
  }

  return { ok: false, message: "unsupported_checkout_mode" };
}

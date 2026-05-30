import type Stripe from "stripe";
import type { BillingCurrency } from "@/lib/billing/billing-currency";
import type { SubscribePlanType } from "@/lib/billing/subscribe-plan-type";
import type { SubtrackPublicPaidPlan } from "@/lib/system-settings-public";
import { getBillingSiteUrl } from "@/lib/billing/stripe-env";
import { getStripeServerClient } from "@/lib/billing/stripe-server";
import { paidPlanShowsAnnualPrice } from "@/lib/paid-plan-annual";
import { paidPlanShowsLifetime } from "@/lib/paid-plan-lifetime";

function amountToStripeMinorUnits(amount: number): number {
  return Math.max(1, Math.round(amount * 100));
}

function resolvePlanAmountEur(plan: SubscribePlanType, paid: SubtrackPublicPaidPlan): number | null {
  if (plan === "monthly") return paid.priceEur;
  if (plan === "annual") {
    if (!paidPlanShowsAnnualPrice(paid) || paid.annualPriceEur == null) return null;
    return paid.annualPriceEur;
  }
  if (plan === "lifetime") {
    if (!paidPlanShowsLifetime(paid.lifetime) || paid.lifetime.priceEur == null) {
      return null;
    }
    return paid.lifetime.priceEur;
  }
  return null;
}

function buildRecurringPriceData(
  amountEur: number,
  currency: BillingCurrency,
  interval: "month" | "year",
): Stripe.Checkout.SessionCreateParams.LineItem.PriceData {
  return {
    currency: currency.toLowerCase(),
    unit_amount: amountToStripeMinorUnits(amountEur),
    recurring: { interval },
    product_data: {
      name: "SubTrack Pro",
    },
  };
}

export async function createStripeCheckoutSession(input: {
  userId: string;
  email: string;
  plan: SubscribePlanType;
  paid: SubtrackPublicPaidPlan;
  currency: BillingCurrency;
  existingStripeCustomerId: string | null;
}): Promise<
  { ok: true; url: string; customerId: string } | { ok: false; message: string }
> {
  const stripe = getStripeServerClient();
  if (!stripe) {
    return { ok: false, message: "stripe_not_configured" };
  }

  const amountEur = resolvePlanAmountEur(input.plan, input.paid);
  if (amountEur == null) {
    return { ok: false, message: "plan_unavailable" };
  }

  const siteUrl = getBillingSiteUrl();
  const metadata = {
    user_id: input.userId,
    plan: input.plan,
  };

  let customer = input.existingStripeCustomerId ?? undefined;
  if (!customer) {
    try {
      const created = await stripe.customers.create({
        email: input.email || undefined,
        metadata: { user_id: input.userId },
      });
      customer = created.id;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "stripe_customer_failed";
      return { ok: false, message: msg };
    }
  }

  const common: Stripe.Checkout.SessionCreateParams = {
    customer,
    client_reference_id: input.userId,
    metadata,
    success_url: `${siteUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}&plan=${input.plan}`,
    cancel_url: `${siteUrl}/subscribe?canceled=1`,
  };

  try {
    if (input.plan === "lifetime") {
      const session = await stripe.checkout.sessions.create({
        ...common,
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: amountToStripeMinorUnits(amountEur),
              product_data: {
                name: "SubTrack Pro Lifetime",
              },
            },
          },
        ],
      });
      if (!session.url) {
        return { ok: false, message: "stripe_no_checkout_url" };
      }
      return { ok: true, url: session.url, customerId: customer };
    }

    const interval = input.plan === "annual" ? "year" : "month";
    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: buildRecurringPriceData(amountEur, input.currency, interval),
        },
      ],
      subscription_data: {
        metadata,
      },
    });
    if (!session.url) {
      return { ok: false, message: "stripe_no_checkout_url" };
    }
    return { ok: true, url: session.url, customerId: customer };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_checkout_failed";
    return { ok: false, message: msg };
  }
}

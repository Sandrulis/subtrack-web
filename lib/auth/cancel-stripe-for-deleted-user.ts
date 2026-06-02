import { isStripeConfigured } from "@/lib/billing/stripe-env";
import { getStripeServerClient } from "@/lib/billing/stripe-server";

export type UserStripeBillingRow = {
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  pro_vip?: boolean | null;
};

const CANCELABLE_SUB_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

/**
 * Aptur Stripe abonementus un (ja iespējams) dzēš klientu, lai vairs netiktu iekasēta maksa.
 * Kļūdas netraucē konta dzēšanu — best-effort.
 */
export async function cancelStripeBillingForDeletedUser(
  row: UserStripeBillingRow,
): Promise<void> {
  if (row.pro_vip === true) return;
  if (!isStripeConfigured()) return;

  const stripeClient = getStripeServerClient();
  if (!stripeClient) return;
  const stripe = stripeClient;

  const customerId =
    typeof row.stripe_customer_id === "string" ? row.stripe_customer_id.trim() : "";
  const knownSubId =
    typeof row.stripe_subscription_id === "string"
      ? row.stripe_subscription_id.trim()
      : "";

  async function cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
    } catch {
      /* jau atcelts vai nav atrasts */
    }
  }

  if (knownSubId) {
    await cancelSubscription(knownSubId);
  }

  if (customerId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      });
      for (const sub of subs.data) {
        if (CANCELABLE_SUB_STATUSES.has(sub.status)) {
          await cancelSubscription(sub.id);
        }
      }
    } catch {
      /* turpinām dzēšanu */
    }

    try {
      await stripe.customers.del(customerId);
    } catch {
      /* piem. vēl atlikušas invoices — abonementi jau atcelti */
    }
  }
}

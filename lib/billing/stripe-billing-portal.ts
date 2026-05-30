import { getBillingSiteUrl } from "@/lib/billing/stripe-env";
import { getStripeServerClient } from "@/lib/billing/stripe-server";

export async function createStripeBillingPortalUrl(
  stripeCustomerId: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const stripe = getStripeServerClient();
  if (!stripe) {
    return { ok: false, message: "stripe_not_configured" };
  }

  const siteUrl = getBillingSiteUrl();
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${siteUrl}/dashboard?billing=1`,
    });
    if (!session.url) {
      return { ok: false, message: "portal_no_url" };
    }
    return { ok: true, url: session.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "portal_failed";
    return { ok: false, message: msg };
  }
}

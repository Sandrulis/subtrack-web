import type Stripe from "stripe";

export function checkoutSessionPaymentSettled(
  session: Stripe.Checkout.Session,
): boolean {
  const status = session.payment_status;
  return status === "paid" || status === "no_payment_required";
}

export function resolveCheckoutSessionUserId(
  session: Stripe.Checkout.Session,
): string {
  const fromMeta =
    typeof session.metadata?.user_id === "string"
      ? session.metadata.user_id.trim()
      : "";
  if (fromMeta) return fromMeta;
  const ref =
    typeof session.client_reference_id === "string"
      ? session.client_reference_id.trim()
      : "";
  return ref;
}

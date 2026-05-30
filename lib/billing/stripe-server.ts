import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/billing/stripe-env";

let stripeClient: Stripe | null = null;

export function getStripeServerClient(): Stripe | null {
  const key = getStripeSecretKey();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }
  return stripeClient;
}

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { grantProFromCheckoutSession } from "@/lib/billing/verify-checkout-grant";

/**
 * Lietotāja `/api/billing/sync-checkout` – stingra pārbaude (aktīvs vai īslaicīgi `incomplete` abonements).
 * Vecu `cs_` sesiju replay pēc atcelšanas nedrīkst atjaunot Pro.
 */
export async function syncBillingFromCheckoutSession(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<{ ok: true } | { ok: false; message: string }> {
  return grantProFromCheckoutSession(supabase, session, {
    allowIncompleteSubscription: true,
  });
}

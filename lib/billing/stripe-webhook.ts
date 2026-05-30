import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { grantProFromCheckoutSession } from "@/lib/billing/verify-checkout-grant";

export {
  applySubscriptionState,
  handleStripeSubscriptionDeleted,
  handleStripeSubscriptionUpdated,
} from "@/lib/billing/subscription-billing-state";

export async function handleStripeCheckoutSessionCompleted(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  await grantProFromCheckoutSession(supabase, session, {
    allowIncompleteSubscription: true,
  });
}

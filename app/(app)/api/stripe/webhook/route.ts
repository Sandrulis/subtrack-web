import { NextResponse } from "next/server";
import { getStripeWebhookSecret } from "@/lib/billing/stripe-env";
import { getStripeServerClient } from "@/lib/billing/stripe-server";
import {
  handleStripeCheckoutSessionCompleted,
  handleStripeSubscriptionDeleted,
  handleStripeSubscriptionUpdated,
} from "@/lib/billing/stripe-webhook";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ received: false }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ received: false }, { status: 503 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleStripeCheckoutSessionCompleted(supabase, session);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        await handleStripeSubscriptionUpdated(supabase, sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await handleStripeSubscriptionDeleted(supabase, sub);
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ received: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

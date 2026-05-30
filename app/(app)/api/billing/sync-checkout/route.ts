import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";
import { getStripeServerClient } from "@/lib/billing/stripe-server";
import { isStripeConfigured } from "@/lib/billing/stripe-env";
import { resolveCheckoutSessionUserId } from "@/lib/billing/checkout-session-utils";
import { syncBillingFromCheckoutSession } from "@/lib/billing/sync-checkout-session";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(
    request,
    await getUiPhraseForRequest("api.billing.sync_checkout.bad_request"),
  );
  if (!parsedBody.ok) return parsedBody.response;

  const auth = await requireApiSession(
    await getUiPhraseForRequest("api.billing.checkout.unauthorized"),
  );
  if (!auth.ok) return auth.response;

  const sessionId =
    typeof (parsedBody.body as { session_id?: unknown })?.session_id === "string"
      ? (parsedBody.body as { session_id: string }).session_id.trim()
      : "";
  if (!sessionId.startsWith("cs_")) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.billing.sync_checkout.bad_request"),
    );
  }

  if (!isStripeConfigured()) {
    return apiJsonError(
      503,
      await getUiPhraseForRequest("api.billing.checkout.not_configured"),
    );
  }

  const stripe = getStripeServerClient();
  const service = createServiceRoleSupabaseClient();
  if (!stripe || !service) {
    return apiJsonError(
      503,
      await getUiPhraseForRequest("api.billing.checkout.not_configured"),
    );
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return apiJsonError(
      502,
      await getUiPhraseForRequest("api.billing.sync_checkout.error"),
    );
  }

  const ownerId = resolveCheckoutSessionUserId(session);
  if (ownerId !== auth.user.id) {
    return apiJsonError(403, await getUiPhraseForRequest("api.billing.sync_checkout.forbidden"));
  }

  const result = await syncBillingFromCheckoutSession(service, session);
  if (!result.ok) {
    const pendingMessages = new Set([
      "payment_not_completed",
      "session_not_complete",
      "subscription_not_active",
      "subscription_missing",
    ]);
    if (pendingMessages.has(result.message)) {
      return apiJsonError(
        409,
        await getUiPhraseForRequest("api.billing.sync_checkout.pending"),
      );
    }
    return apiJsonError(
      502,
      await getUiPhraseForRequest("api.billing.sync_checkout.error"),
    );
  }

  const { data: row } = await service
    .from("users")
    .select("paid_plan_active, paid_plan_type")
    .eq("id", auth.user.id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    paid_plan_active: row?.paid_plan_active === true,
    paid_plan_type: row?.paid_plan_type ?? null,
  });
}

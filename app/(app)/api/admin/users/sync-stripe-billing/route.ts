import { NextResponse } from "next/server";
import { asJsonRecord, parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiAdmin } from "@/lib/api/require-api-admin";
import { apiJsonError } from "@/lib/api/json-response";
import { syncUserBillingFromStripe } from "@/lib/billing/sync-user-billing-from-stripe";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";
import { isValidUuid } from "@/lib/validation/uuid";

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(
    request,
    await getUiPhraseForRequest("api.admin.sync_stripe.bad_request"),
  );
  if (!parsedBody.ok) return parsedBody.response;

  const rec = asJsonRecord(parsedBody.body);
  const userIdRaw = rec.userId;
  const userId =
    typeof userIdRaw === "string" ? userIdRaw.trim() : String(userIdRaw ?? "").trim();

  if (!isValidUuid(userId)) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.admin.sync_stripe.bad_request"),
    );
  }

  const admin = await requireApiAdmin({
    unauthorized: await getUiPhraseForRequest("api.admin.sync_stripe.unauthorized"),
    forbidden: await getUiPhraseForRequest("api.admin.sync_stripe.forbidden"),
  });
  if (!admin.ok) return admin.response;

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.admin.sync_stripe.error"),
    );
  }

  const result = await syncUserBillingFromStripe(service, userId);
  if (!result.ok) {
    const msgKey = messageToPhraseKey(result.message);
    if (msgKey) {
      return apiJsonError(400, await getUiPhraseForRequest(msgKey));
    }
    return apiJsonError(500, await getUiPhraseForRequest("api.admin.sync_stripe.error"));
  }

  return NextResponse.json({
    success: true,
    paid_plan_active: result.paid_plan_active,
    paid_plan_type: result.paid_plan_type,
    source: result.source,
  });
}

function messageToPhraseKey(message: string): string | null {
  switch (message) {
    case "stripe_not_configured":
      return "api.admin.sync_stripe.not_configured";
    case "no_stripe_customer":
      return "api.admin.sync_stripe.no_customer";
    case "user_not_found":
      return "api.admin.sync_stripe.not_found";
    case "user_is_vip":
      return "api.admin.sync_stripe.is_vip";
    default:
      return null;
  }
}

import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { requireApiSession } from "@/lib/api/require-api-session";
import { createStripeBillingPortalUrl } from "@/lib/billing/stripe-billing-portal";
import { isStripeConfigured } from "@/lib/billing/stripe-env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function POST() {
  const auth = await requireApiSession(
    await getUiPhraseForRequest("api.billing.portal.unauthorized"),
  );
  if (!auth.ok) return auth.response;

  if (!isStripeConfigured()) {
    return apiJsonError(
      503,
      await getUiPhraseForRequest("api.billing.portal.not_configured"),
    );
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return apiJsonError(
      503,
      await getUiPhraseForRequest("api.billing.portal.error"),
    );
  }

  const { data: row, error } = await service
    .from("users")
    .select("stripe_customer_id, pro_vip")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error || !row) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.billing.portal.error"),
    );
  }

  if (row.pro_vip === true) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.billing.portal.vip_no_portal"),
    );
  }

  const customerId =
    typeof row.stripe_customer_id === "string" ? row.stripe_customer_id.trim() : "";
  if (!customerId) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.billing.portal.no_customer"),
    );
  }

  const result = await createStripeBillingPortalUrl(customerId);
  if (!result.ok) {
    if (result.message === "stripe_not_configured") {
      return apiJsonError(
        503,
        await getUiPhraseForRequest("api.billing.portal.not_configured"),
      );
    }
    return apiJsonError(
      502,
      await getUiPhraseForRequest("api.billing.portal.error"),
    );
  }

  return NextResponse.json({ success: true, url: result.url });
}

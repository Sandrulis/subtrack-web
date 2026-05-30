import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";
import {
  buildProMembershipSubscriptionRow,
  isProTrackPlan,
  PRO_MEMBERSHIP_TRACK_NOTE,
  resolveProTrackAmountEur,
} from "@/lib/billing/pro-track-subscription";
import { fetchAllowedSubscriptionCategoryKeys } from "@/lib/subscriptions/subscription-categories-server";
import { mapSubscriptionRowToClient } from "@/lib/subscriptions/subscription-map";
import type { SubscriptionRow } from "@/lib/subscriptions/subscription-client";
import { navUserHasPaidProMembership } from "@/lib/auth/pro-plan-access";
import { getPublicSystemSettings } from "@/lib/system-settings-public";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(request, "Invalid JSON body");
  if (!parsedBody.ok) return parsedBody.response;

  const auth = await requireApiSession(
    await getUiPhraseForRequest("api.billing.pro_track.unauthorized"),
  );
  if (!auth.ok) return auth.response;

  const planRaw = (parsedBody.body as { plan?: unknown })?.plan;
  if (!isProTrackPlan(planRaw)) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.billing.pro_track.bad_request"),
    );
  }

  const { supabase, user } = auth;

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return apiJsonError(
      503,
      await getUiPhraseForRequest("api.billing.pro_track.error"),
    );
  }

  const { data: billingRow, error: billingErr } = await service
    .from("users")
    .select("paid_plan_active, pro_vip")
    .eq("id", user.id)
    .maybeSingle();

  if (billingErr) {
    return apiJsonError(
      503,
      await getUiPhraseForRequest("api.billing.pro_track.error"),
    );
  }

  if (
    !navUserHasPaidProMembership({
      paidPlanActive: billingRow?.paid_plan_active === true,
      proVip: billingRow?.pro_vip === true,
    })
  ) {
    return apiJsonError(
      403,
      await getUiPhraseForRequest("api.billing.pro_track.pro_required"),
    );
  }

  const { count, error: countErr } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("note", PRO_MEMBERSHIP_TRACK_NOTE);

  if (countErr) {
    return apiJsonError(503, countErr.message);
  }
  if ((count ?? 0) > 0) {
    return apiJsonError(
      409,
      await getUiPhraseForRequest("api.billing.pro_track.already_exists"),
    );
  }

  const { paidPlan, systemName } = await getPublicSystemSettings();
  if (!paidPlan.enabled) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.billing.checkout.paid_plan_off"),
    );
  }

  const amountEur = resolveProTrackAmountEur(planRaw, paidPlan);
  if (amountEur == null) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.billing.checkout.plan_unavailable"),
    );
  }

  const allowedCategories = await fetchAllowedSubscriptionCategoryKeys();
  if (!allowedCategories.has("subscription")) {
    return apiJsonError(
      503,
      await getUiPhraseForRequest("api.billing.pro_track.error"),
    );
  }

  const insertRow = {
    ...buildProMembershipSubscriptionRow({
      systemName,
      plan: planRaw,
      amountEur,
    }),
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .insert(insertRow)
    .select("*")
    .single();

  if (error || !data) {
    return apiJsonError(
      400,
      error?.message ??
        (await getUiPhraseForRequest("api.billing.pro_track.error")),
    );
  }

  return NextResponse.json({
    success: true,
    subscription: mapSubscriptionRowToClient(data as SubscriptionRow),
  });
}

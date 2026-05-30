import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";
import { createStripeCheckoutSession } from "@/lib/billing/stripe-checkout";
import { isStripeConfigured } from "@/lib/billing/stripe-env";
import { paidPlanShowsAnnualPrice } from "@/lib/paid-plan-annual";
import { paidPlanShowsLifetime } from "@/lib/paid-plan-lifetime";
import { isSubscribePlanType } from "@/lib/billing/subscribe-plan-type";
import { resolveSessionUserBillingCurrency } from "@/lib/billing/resolve-billing-currency";
import { fetchSystemPaidPlanLiveForDashboard } from "@/lib/subscriptions/dashboard-free-tier-gate";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";
import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import { isProTrialActive, normalizeProTrialConfig } from "@/lib/auth/pro-trial-access";

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(
    request,
    await getUiPhraseForRequest("api.billing.checkout.bad_request"),
  );
  if (!parsedBody.ok) return parsedBody.response;

  const auth = await requireApiSession(
    await getUiPhraseForRequest("api.billing.checkout.unauthorized"),
  );
  if (!auth.ok) return auth.response;

  const body =
    typeof parsedBody.body === "object" && parsedBody.body !== null
      ? (parsedBody.body as Record<string, unknown>)
      : {};
  const plan = body.plan;
  if (!isSubscribePlanType(plan)) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.billing.checkout.bad_request"),
    );
  }

  const paid = await fetchSystemPaidPlanLiveForDashboard();
  if (!paid.enabled) {
    return apiJsonError(
      403,
      await getUiPhraseForRequest("api.billing.checkout.paid_plan_off"),
    );
  }

  if (plan === "annual" && !paidPlanShowsAnnualPrice(paid)) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.billing.checkout.plan_unavailable"),
    );
  }

  if (plan === "lifetime") {
    const lifetimeOk =
      paidPlanShowsLifetime(paid.lifetime) && paid.lifetime.priceEur != null;
    if (!lifetimeOk) {
      return apiJsonError(
        400,
        await getUiPhraseForRequest("api.billing.checkout.plan_unavailable"),
      );
    }
  }

  if (!isStripeConfigured()) {
    return apiJsonError(
      503,
      await getUiPhraseForRequest("api.billing.checkout.not_configured"),
    );
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return apiJsonError(
      503,
      await getUiPhraseForRequest("api.billing.checkout.not_configured"),
    );
  }

  const { data: userRow, error: userErr } = await service
    .from("users")
    .select(
      "email, stripe_customer_id, paid_plan_active, pro_vip, pro_trial_used, pro_trial_started_at",
    )
    .eq("id", auth.user.id)
    .maybeSingle();

  if (userErr || !userRow) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.billing.checkout.error"),
    );
  }

  const { data: sysTrial } = await service
    .from("system_settings")
    .select("pro_trial_enabled, pro_trial_days")
    .eq("id", 1)
    .maybeSingle();
  const trialConfig = normalizeProTrialConfig(sysTrial);

  if (
    navUserHasProEntitlement({
      paidPlanActive: userRow.paid_plan_active === true,
      proVip: userRow.pro_vip === true,
      proTrialActive: isProTrialActive(
        {
          paidPlanActive: userRow.paid_plan_active === true,
          proVip: userRow.pro_vip === true,
          proTrialUsed: userRow.pro_trial_used === true,
          proTrialStartedAt:
            typeof userRow.pro_trial_started_at === "string"
              ? userRow.pro_trial_started_at
              : null,
        },
        trialConfig,
        { paidPlanEnabled: paid.enabled },
      ),
    })
  ) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.billing.checkout.already_pro"),
    );
  }

  const billingCurrency = await resolveSessionUserBillingCurrency(auth.user.id);
  const email =
    (typeof userRow.email === "string" ? userRow.email.trim() : "") ||
    auth.user.email ||
    "";

  const existingCustomerId =
    typeof userRow.stripe_customer_id === "string"
      ? userRow.stripe_customer_id.trim() || null
      : null;

  const result = await createStripeCheckoutSession({
    userId: auth.user.id,
    email,
    plan,
    paid,
    currency: billingCurrency,
    existingStripeCustomerId: existingCustomerId,
  });

  if (!result.ok) {
    if (result.message === "plan_unavailable") {
      return apiJsonError(
        400,
        await getUiPhraseForRequest("api.billing.checkout.plan_unavailable"),
      );
    }
    return apiJsonError(
      502,
      await getUiPhraseForRequest("api.billing.checkout.error"),
    );
  }

  if (!existingCustomerId && result.customerId) {
    await service
      .from("users")
      .update({ stripe_customer_id: result.customerId })
      .eq("id", auth.user.id);
  }

  return NextResponse.json({ success: true, url: result.url });
}

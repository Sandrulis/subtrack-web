import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";
import { fetchDashboardSubscriptionsWithFamilyShare } from "@/lib/family-sharing/family-sharing-server";
import { fetchPaidCalendarDaysForSession } from "@/lib/subscriptions/fetch-paid-calendar-server";
import { fetchAllowedSubscriptionCategoryKeys } from "@/lib/subscriptions/subscription-categories-server";
import {
  mapSubscriptionRowToClient,
  parseSubscriptionPayload,
} from "@/lib/subscriptions/subscription-map";
import type { SubscriptionRow } from "@/lib/subscriptions/subscription-client";
import { getUiPhraseForRequest, resolveRequestUiLocales } from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import {
  normalizeProTrialConfig,
  userRowHasProEntitlement,
} from "@/lib/auth/pro-trial-access";
import { coercePgBool } from "@/lib/system-settings-public";

function parseFreeSubscriptionLimit(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.trunc(raw);
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  try {
    const [bundle, paidCalendarDays] = await Promise.all([
      fetchDashboardSubscriptionsWithFamilyShare(),
      fetchPaidCalendarDaysForSession(),
    ]);
    return NextResponse.json({
      subscriptions: bundle.subscriptions,
      paidCalendarDays,
    });
  } catch {
    return apiJsonError(500, "Failed to load subscriptions");
  }
}

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(request, "Invalid JSON body");
  if (!parsedBody.ok) return parsedBody.response;

  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const allowedCategories = await fetchAllowedSubscriptionCategoryKeys();
  const parsed = parseSubscriptionPayload(
    parsedBody.body as Parameters<typeof parseSubscriptionPayload>[0],
    { allowedCategories },
  );
  if (!parsed.ok) {
    return apiJsonError(400, parsed.message);
  }

  const { data: sys, error: sysErr } = await supabase
    .from("system_settings")
    .select(
      "paid_plan_enabled, paid_plan_price_eur, paid_plan_free_subscription_limit, pro_trial_enabled, pro_trial_days",
    )
    .eq("id", 1)
    .maybeSingle();

  if (!sysErr && sys && coercePgBool(sys.paid_plan_enabled)) {
    const freeLimit = parseFreeSubscriptionLimit(sys.paid_plan_free_subscription_limit);
    if (freeLimit !== null && freeLimit >= 0) {
      const trialConfig = normalizeProTrialConfig(sys);
      const paidPlanEnabled = coercePgBool(
        (sys as { paid_plan_enabled?: unknown } | null)?.paid_plan_enabled,
      );
      const { data: urow } = await supabase
        .from("users")
        .select("paid_plan_active, pro_vip, pro_trial_used, pro_trial_started_at")
        .eq("id", user.id)
        .maybeSingle();
      const isPaid = userRowHasProEntitlement(urow, trialConfig, {
        paidPlanEnabled,
      });
      if (!isPaid) {
        const { count, error: cErr } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        if (cErr) {
          return apiJsonError(
            503,
            cErr.message || "Could not verify subscription limit.",
          );
        }
        if (count == null) {
          return apiJsonError(503, "Could not verify subscription limit.");
        }
        const n = count;
        if (n >= freeLimit) {
          const { locale } = await resolveRequestUiLocales();
          const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
          const priceNum =
            typeof sys.paid_plan_price_eur === "number"
              ? sys.paid_plan_price_eur
              : Number.parseFloat(String(sys.paid_plan_price_eur ?? "0"));
          const priceFmt = new Intl.NumberFormat(intlLocale, {
            style: "currency",
            currency: "EUR",
          }).format(Number.isFinite(priceNum) ? priceNum : 0);
          let msg = await getUiPhraseForRequest("api.subscriptions.free_tier_limit");
          msg = msg
            .replace(/\{count\}/g, String(freeLimit))
            .replace(/\{price\}/g, priceFmt);
          return apiJsonError(403, msg);
        }
      }
    }
  }

  const insertRow = {
    ...parsed.row,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .insert(insertRow)
    .select("*")
    .single();

  if (error || !data) {
    return apiJsonError(400, error?.message ?? "Insert failed");
  }

  return NextResponse.json({
    success: true,
    subscription: mapSubscriptionRowToClient(data as SubscriptionRow),
  });
}

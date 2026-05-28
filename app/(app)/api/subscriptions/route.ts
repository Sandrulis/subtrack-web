import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

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
    return NextResponse.json(
      { success: false, message: "Failed to load subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const allowedCategories = await fetchAllowedSubscriptionCategoryKeys();

  const parsed = parseSubscriptionPayload(
    json as Parameters<typeof parseSubscriptionPayload>[0],
    { allowedCategories },
  );
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, message: parsed.message },
      { status: 400 },
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
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
          return NextResponse.json(
            {
              success: false,
              message: cErr.message || "Could not verify subscription limit.",
            },
            { status: 503 },
          );
        }
        if (count == null) {
          return NextResponse.json(
            {
              success: false,
              message: "Could not verify subscription limit.",
            },
            { status: 503 },
          );
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
          return NextResponse.json({ success: false, message: msg }, { status: 403 });
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
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Insert failed",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    subscription: mapSubscriptionRowToClient(data as SubscriptionRow),
  });
}

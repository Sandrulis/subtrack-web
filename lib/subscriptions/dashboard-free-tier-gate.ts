import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  normalizePaidPlanRow,
  type SubtrackPublicPaidPlan,
} from "@/lib/system-settings-public";

export { canAccessAnalytics } from "./analytics-access";
export {
  buildDashboardFreeTierGatePayload,
  isProFeaturePreviewLocked,
  type DashboardFreeTierGatePayload,
} from "./dashboard-free-tier-gate-payload";

const PAID_PLAN_FALLBACK: SubtrackPublicPaidPlan = {
  enabled: false,
  priceEur: 1.99,
  freeSubscriptionLimit: 5,
  annualBillingEnabled: false,
  annualPriceEur: null,
  lifetime: {
    enabled: false,
    priceEur: null,
    endsAt: null,
    purchaseLimit: null,
    purchaseCount: 0,
    active: false,
    remainingMs: null,
    purchasesRemaining: null,
  },
};

/**
 * Bez lappuses keša – lai /dashboard uzreiz redz admina ieslēgto maksas plānu
 * (sk. `getPublicSystemSettings` unstable_cache).
 */
export async function fetchSystemPaidPlanLiveForDashboard(): Promise<SubtrackPublicPaidPlan> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("system_settings")
      .select(
        "paid_plan_enabled, paid_plan_price_eur, paid_plan_free_subscription_limit, paid_plan_annual_enabled, paid_plan_annual_price_eur, paid_plan_lifetime_enabled, paid_plan_lifetime_price_eur, paid_plan_lifetime_ends_at, paid_plan_lifetime_purchase_limit, paid_plan_lifetime_purchase_count, pro_trial_enabled, pro_trial_days",
      )
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return { ...PAID_PLAN_FALLBACK };
    return normalizePaidPlanRow(data);
  } catch {
    return { ...PAID_PLAN_FALLBACK };
  }
}

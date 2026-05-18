import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  normalizePaidPlanRow,
  type SubtrackPublicPaidPlan,
} from "@/lib/system-settings-public";

export { canAccessAnalytics } from "./analytics-access";

/** Panelim: vai jābūt klienta pārbaudē pirms „Pievienot” modāļa. */
export type DashboardFreeTierGatePayload = {
  /** `system_settings.paid_plan_enabled` */
  enforcement: boolean;
  freeLimit: number;
  /** `paid_plan_active` vai `pro_vip` */
  isPaidUser: boolean;
  priceEur: number;
};

const PAID_PLAN_FALLBACK: SubtrackPublicPaidPlan = {
  enabled: false,
  priceEur: 1.99,
  freeSubscriptionLimit: 5,
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
      .select("paid_plan_enabled, paid_plan_price_eur, paid_plan_free_subscription_limit")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return { ...PAID_PLAN_FALLBACK };
    return normalizePaidPlanRow(data);
  } catch {
    return { ...PAID_PLAN_FALLBACK };
  }
}

export function buildDashboardFreeTierGatePayload(
  userDisplay: NavUserDisplay | null | undefined,
  paidPlan: SubtrackPublicPaidPlan,
): DashboardFreeTierGatePayload {
  return {
    enforcement: Boolean(paidPlan.enabled),
    freeLimit: paidPlan.freeSubscriptionLimit,
    isPaidUser: navUserHasProEntitlement(userDisplay),
    priceEur: paidPlan.priceEur,
  };
}

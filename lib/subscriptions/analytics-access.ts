import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import type { SubtrackPublicPaidPlan } from "@/lib/system-settings-public";

/**
 * Analītikas maršruts: ja admin ir ieslēdzis maksas plānu, piekļuve tikai ar
 * Pro statusu (`paid_plan_active` vai `pro_vip`). Citādi – kā iepriekš (visiem ielogotajiem).
 *
 * Klients un serveris – bez `next/headers` / Supabase server klienta.
 */
export function canAccessAnalytics(
  paidPlan: SubtrackPublicPaidPlan,
  userDisplay: NavUserDisplay | null | undefined,
): boolean {
  if (!paidPlan.enabled) return true;
  return navUserHasProEntitlement(userDisplay);
}
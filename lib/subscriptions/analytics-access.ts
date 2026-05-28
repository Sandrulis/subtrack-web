import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import type { SubtrackPublicPaidPlan } from "@/lib/system-settings-public";

/**
 * Pilna analītikas funkcionalitāte (bez blur): ja admin ir ieslēdzis maksas plānu,
 * tikai ar Pro statusu (`paid_plan_active`, `pro_vip` vai aktīvs izmēģinājums).
 * Maršruts `/analytics` brīvā līmenī joprojām atverams (priekšskatījums ar blur).
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
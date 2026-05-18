import type { NavUserDisplay } from "@/lib/auth/user-display";

/**
 * Paneļa Pro līmenis (neierobežots ierakstu skaits, kalendārs, analītika u.tml. kad
 * `paid_plan_enabled`): `paid_plan_active` (apmaksa / admin lauks checkout) vai
 * `pro_vip` (admin dāvināta piekļuve).
 */
export function navUserHasProEntitlement(
  user: Pick<NavUserDisplay, "paidPlanActive" | "proVip"> | null | undefined,
): boolean {
  return user?.paidPlanActive === true || user?.proVip === true;
}

import type { NavUserDisplay } from "@/lib/auth/user-display";

/**
 * Paneļa Pro līmenis (neierobežots ierakstu skaits, kalendārs, analītika u.tml. kad
 * `paid_plan_enabled`): `paid_plan_active` (apmaksa), `pro_vip` (admin dāvina) vai
 * aktīvs Pro izmēģinājums (`proTrialActive` no sesijas profila).
 */
/** Apmaksāts Pro vai admin VIP (bez izmēģinājuma). Kronītim un „Aktīvs maksas plāns”. */
export function navUserHasPaidProMembership(
  user: Pick<NavUserDisplay, "paidPlanActive" | "proVip"> | null | undefined,
): boolean {
  return user?.paidPlanActive === true || user?.proVip === true;
}

export function navUserHasProEntitlement(
  user: Pick<NavUserDisplay, "paidPlanActive" | "proVip" | "proTrialActive"> | null | undefined,
): boolean {
  return (
    navUserHasPaidProMembership(user) || user?.proTrialActive === true
  );
}

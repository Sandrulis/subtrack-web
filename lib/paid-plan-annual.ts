export const PAID_PLAN_PRICE_MIN = 0.01;
export const PAID_PLAN_PRICE_MAX = 9999.99;

export function parsePaidPlanPriceField(raw: unknown): number | null {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseFloat(raw.replace(",", "."))
        : NaN;
  if (!Number.isFinite(n) || n < PAID_PLAN_PRICE_MIN || n > PAID_PLAN_PRICE_MAX) {
    return null;
  }
  return Math.round(n * 100) / 100;
}

export function isValidPaidPlanAnnualPrice(annualEur: number | null | undefined): annualEur is number {
  return annualEur != null && annualEur >= PAID_PLAN_PRICE_MIN && annualEur <= PAID_PLAN_PRICE_MAX;
}

export function paidPlanTwelveMonthlyTotalEur(monthlyEur: number): number {
  const m = Number.isFinite(monthlyEur) ? monthlyEur : 0;
  return Math.round(m * 12 * 100) / 100;
}

/** Atlaide % pret 12× mēneša cenu; `null`, ja nav atlaides vai nederīgas cenas. */
export function paidPlanAnnualDiscountPercent(
  monthlyEur: number,
  annualEur: number,
): number | null {
  if (!isValidPaidPlanAnnualPrice(annualEur)) return null;
  const twelve = paidPlanTwelveMonthlyTotalEur(monthlyEur);
  if (twelve <= 0 || annualEur >= twelve) return null;
  const pct = ((twelve - annualEur) / twelve) * 100;
  return Math.round(pct);
}

export function paidPlanAnnualEquivMonthlyFromAnnual(annualEur: number): number {
  return Math.round((annualEur / 12) * 100) / 100;
}

/** Vesels atlaides % (bez decimāldaļām). */
export function formatPaidPlanDiscountPercent(pct: number): string {
  return String(Math.round(pct));
}

export type PaidPlanAnnualPitchCopy = {
  annualFormatted: string;
  discountPercent: number | null;
  /** Kopā savienots teksts (subscribe u.c.) */
  line: string;
  discountSuffix: string | null;
  equiv: string;
};

/** Publiskais gada cenu bloks; `null`, ja nav derīgas gada cenas. */
export function buildPaidPlanAnnualPitchCopy(
  monthlyEur: number,
  annualPriceEur: number | null | undefined,
  fmtEur: (amount: number) => string,
  t: (key: string) => string,
  keys: {
    line: string;
    discount: string;
    equiv: string;
  },
): PaidPlanAnnualPitchCopy | null {
  if (!isValidPaidPlanAnnualPrice(annualPriceEur)) return null;
  const annual = annualPriceEur;
  const discountPct = paidPlanAnnualDiscountPercent(monthlyEur, annual);
  const line = t(keys.line).replace(/\{annual\}/g, fmtEur(annual));
  const discountSuffix =
    discountPct != null && discountPct > 0
      ? t(keys.discount).replace(
          /\{discount\}/g,
          formatPaidPlanDiscountPercent(discountPct),
        )
      : null;
  const equiv = t(keys.equiv).replace(
    /\{equiv\}/g,
    fmtEur(paidPlanAnnualEquivMonthlyFromAnnual(annual)),
  );
  return {
    annualFormatted: fmtEur(annual),
    discountPercent: discountPct != null && discountPct > 0 ? discountPct : null,
    line,
    discountSuffix,
    equiv,
  };
}

export function paidPlanShowsAnnualPrice(plan: {
  enabled: boolean;
  annualBillingEnabled: boolean;
  annualPriceEur: number | null;
}): boolean {
  return (
    plan.enabled &&
    plan.annualBillingEnabled &&
    isValidPaidPlanAnnualPrice(plan.annualPriceEur)
  );
}

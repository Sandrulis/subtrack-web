export const PAID_PLAN_TYPES = ["monthly", "annual", "lifetime"] as const;

export type PaidPlanType = (typeof PAID_PLAN_TYPES)[number];

export function isPaidPlanType(v: unknown): v is PaidPlanType {
  return (
    typeof v === "string" &&
    (PAID_PLAN_TYPES as readonly string[]).includes(v)
  );
}

export function normalizePaidPlanType(v: unknown): PaidPlanType | null {
  return isPaidPlanType(v) ? v : null;
}

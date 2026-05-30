export const SUBSCRIBE_PLAN_TYPES = ["monthly", "annual", "lifetime"] as const;

export type SubscribePlanType = (typeof SUBSCRIBE_PLAN_TYPES)[number];

export function isSubscribePlanType(v: unknown): v is SubscribePlanType {
  return (
    typeof v === "string" &&
    (SUBSCRIBE_PLAN_TYPES as readonly string[]).includes(v)
  );
}

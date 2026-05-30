import type { SubscribePlanType } from "@/lib/billing/subscribe-plan-type";
import { parsePaidPlanPriceField } from "@/lib/paid-plan-annual";
import type { SubtrackPublicPaidPlan } from "@/lib/system-settings-public";
import { paidPlanShowsAnnualPrice } from "@/lib/paid-plan-annual";

/** Ieraksta `note` – lai nepievienotu dublikātus. */
export const PRO_MEMBERSHIP_TRACK_NOTE = "subtrack:pro-membership";

export type ProTrackPlan = "monthly" | "annual";

export function isProTrackPlan(v: unknown): v is ProTrackPlan {
  return v === "monthly" || v === "annual";
}

export function proTrackPlanFromSubscribe(
  plan: SubscribePlanType | null | undefined,
): ProTrackPlan | null {
  if (plan === "monthly" || plan === "annual") return plan;
  return null;
}

export function subscriptionPeriodForProTrack(plan: ProTrackPlan): "monthly" | "yearly" {
  return plan === "annual" ? "yearly" : "monthly";
}

export function formatTodayYmdUtc(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function resolveProTrackAmountEur(
  plan: ProTrackPlan,
  paid: SubtrackPublicPaidPlan,
): number | null {
  if (plan === "monthly") {
    return parsePaidPlanPriceField(paid.priceEur);
  }
  if (!paidPlanShowsAnnualPrice(paid) || paid.annualPriceEur == null) {
    return null;
  }
  return parsePaidPlanPriceField(paid.annualPriceEur);
}

export function buildProMembershipSubscriptionRow(input: {
  systemName: string;
  plan: ProTrackPlan;
  amountEur: number;
}): Record<string, unknown> {
  const name = `${input.systemName.trim() || "SubTrack"} Pro`;
  return {
    name,
    category: "subscription",
    amount: input.amountEur,
    is_dynamic_amount: false,
    is_dynamic_carry_previous: false,
    period: subscriptionPeriodForProTrack(input.plan),
    next_payment_date: formatTodayYmdUtc(),
    icon: "fa-solid fa-credit-card",
    color: null,
    note: PRO_MEMBERSHIP_TRACK_NOTE,
    term_start: null,
    term_end: null,
    devices: [],
  };
}

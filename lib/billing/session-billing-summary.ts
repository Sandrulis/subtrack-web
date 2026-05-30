import {
  isProTrialActive,
  type ProTrialConfig,
} from "@/lib/auth/pro-trial-access";
import { normalizePaidPlanType, type PaidPlanType } from "@/lib/billing/paid-plan-type";

export type SessionBillingSummary = {
  paidPlanEnabled: boolean;
  paidPlanActive: boolean;
  proVip: boolean;
  proTrialActive: boolean;
  paidPlanType: PaidPlanType | null;
  paidPlanPeriodEndAt: string | null;
  paidPlanAutoRenew: boolean;
  stripeCustomerId: string | null;
};

type BillingUserRow = {
  paid_plan_active?: boolean | null;
  pro_vip?: boolean | null;
  pro_trial_used?: boolean | null;
  pro_trial_started_at?: string | null;
  paid_plan_type?: unknown;
  paid_plan_period_end_at?: string | null;
  paid_plan_auto_renew?: boolean | null;
  stripe_customer_id?: string | null;
};

export function shouldShowBillingMenu(
  billing: SessionBillingSummary | null | undefined,
): boolean {
  if (!billing?.paidPlanEnabled) return false;
  return (
    billing.paidPlanActive ||
    billing.proVip ||
    billing.proTrialActive ||
    Boolean(billing.stripeCustomerId)
  );
}

export function buildSessionBillingSummary(
  paidPlanEnabled: boolean,
  row: BillingUserRow,
  trialConfig: ProTrialConfig,
): SessionBillingSummary {
  const paidPlanActive = row.paid_plan_active === true;
  const proVip = row.pro_vip === true;
  const proTrialStartedAt =
    typeof row.pro_trial_started_at === "string" && row.pro_trial_started_at.trim()
      ? row.pro_trial_started_at.trim()
      : null;

  return {
    paidPlanEnabled,
    paidPlanActive,
    proVip,
    proTrialActive: isProTrialActive(
      {
        paidPlanActive,
        proVip,
        proTrialUsed: row.pro_trial_used === true,
        proTrialStartedAt,
      },
      trialConfig,
      { paidPlanEnabled },
    ),
    paidPlanType: normalizePaidPlanType(row.paid_plan_type),
    paidPlanPeriodEndAt:
      typeof row.paid_plan_period_end_at === "string" && row.paid_plan_period_end_at
        ? row.paid_plan_period_end_at
        : null,
    paidPlanAutoRenew: row.paid_plan_auto_renew === true,
    stripeCustomerId:
      typeof row.stripe_customer_id === "string" && row.stripe_customer_id.trim()
        ? row.stripe_customer_id.trim()
        : null,
  };
}

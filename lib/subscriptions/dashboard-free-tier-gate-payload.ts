import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import type { SubtrackPublicPaidPlan } from "@/lib/system-settings-public";

/** Panelim: vai jābūt klienta pārbaudē pirms „Pievienot” modāļa. */
export type DashboardFreeTierGatePayload = {
  /** `system_settings.paid_plan_enabled` */
  enforcement: boolean;
  freeLimit: number;
  /** `paid_plan_active`, `pro_vip` vai aktīvs izmēģinājums */
  isPaidUser: boolean;
  priceEur: number;
  /** Aktīvs Pro izmēģinājums (badge / progress) */
  trialActive?: boolean;
  trialDaysRemaining?: number;
  trialDaysTotal?: number;
  trialPercentElapsed?: number;
  trialEndsOnFormatted?: string;
};

/** Kalendārs / analītika: maksas plāns ieslēgts, bet lietotājam nav Pro. */
export function isProFeaturePreviewLocked(
  gate: DashboardFreeTierGatePayload,
): boolean {
  return gate.enforcement === true && gate.isPaidUser !== true;
}

export function buildDashboardFreeTierGatePayload(
  userDisplay: NavUserDisplay | null | undefined,
  paidPlan: SubtrackPublicPaidPlan,
): DashboardFreeTierGatePayload {
  const trialActive = userDisplay?.proTrialActive === true;
  const progress = userDisplay?.proTrialProgress;
  return {
    enforcement: Boolean(paidPlan.enabled),
    freeLimit: paidPlan.freeSubscriptionLimit,
    isPaidUser: navUserHasProEntitlement(userDisplay),
    priceEur: paidPlan.priceEur,
    ...(trialActive && progress
      ? {
          trialActive: true,
          trialDaysRemaining: progress.daysRemaining,
          trialDaysTotal: progress.daysTotal,
          trialPercentElapsed: progress.percentElapsed,
          trialEndsOnFormatted: progress.endsOnFormatted,
        }
      : {}),
  };
}

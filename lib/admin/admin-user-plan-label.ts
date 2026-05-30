import type { PaidPlanType } from "@/lib/billing/paid-plan-type";

type PlanLabelUser = {
  paidPlanActive: boolean;
  proVip: boolean;
  paidPlanType: PaidPlanType | null;
};

export function getAdminUserPlanLabelKey(user: PlanLabelUser): string | null {
  if (user.proVip) {
    return "admin.users.pro_status_vip";
  }
  if (!user.paidPlanActive) {
    return "admin.users.pro_none";
  }
  if (user.paidPlanType === "monthly") {
    return "admin.users.plan_monthly";
  }
  if (user.paidPlanType === "annual") {
    return "admin.users.plan_annual";
  }
  if (user.paidPlanType === "lifetime") {
    return "admin.users.plan_lifetime";
  }
  return "admin.users.pro_status_paid";
}

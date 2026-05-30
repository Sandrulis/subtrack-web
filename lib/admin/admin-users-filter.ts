import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import {
  isProTrialActive,
  type ProTrialConfig,
  type ProTrialUserFields,
} from "@/lib/auth/pro-trial-access";
import type { PaidPlanType } from "@/lib/billing/paid-plan-type";

export const ADMIN_USERS_FILTERS = [
  "all",
  "free",
  "pro_monthly",
  "pro_annual",
  "pro_lifetime",
  "vip",
  "trial",
] as const;

/** Kopsavilkuma bloki virs tabulas (bez „Visi”). */
export const ADMIN_USERS_FILTER_CARD_KEYS = [
  "free",
  "trial",
  "pro_monthly",
  "pro_annual",
  "pro_lifetime",
  "vip",
] as const;

export type AdminUsersFilter = (typeof ADMIN_USERS_FILTERS)[number];

export function isAdminUsersFilter(v: unknown): v is AdminUsersFilter {
  return (
    typeof v === "string" &&
    (ADMIN_USERS_FILTERS as readonly string[]).includes(v)
  );
}

export type AdminUsersFilterRow = ProTrialUserFields & {
  paidPlanActive: boolean;
  proVip: boolean;
  paidPlanType: PaidPlanType | null;
};

export function matchesAdminUsersFilter(
  user: AdminUsersFilterRow,
  filter: AdminUsersFilter,
  ctx: { paidPlanEnabled: boolean; proTrial: ProTrialConfig },
): boolean {
  if (filter === "all") return true;

  if (filter === "vip") {
    return user.proVip === true;
  }

  if (filter === "trial") {
    return isProTrialActive(user, ctx.proTrial, {
      paidPlanEnabled: ctx.paidPlanEnabled,
    });
  }

  if (filter === "free") {
    return !navUserHasProEntitlement({
      paidPlanActive: user.paidPlanActive,
      proVip: user.proVip,
      proTrialActive: isProTrialActive(user, ctx.proTrial, {
        paidPlanEnabled: ctx.paidPlanEnabled,
      }),
    });
  }

  if (!user.paidPlanActive || user.proVip) {
    return false;
  }

  const type = user.paidPlanType;

  if (filter === "pro_monthly") return type === "monthly";
  if (filter === "pro_annual") return type === "annual";
  if (filter === "pro_lifetime") return type === "lifetime";

  return true;
}

export function countAdminUsersByFilter(
  users: readonly AdminUsersFilterRow[],
  ctx: { paidPlanEnabled: boolean; proTrial: ProTrialConfig },
): Record<AdminUsersFilter, number> {
  const counts = Object.fromEntries(
    ADMIN_USERS_FILTERS.map((key) => [key, 0]),
  ) as Record<AdminUsersFilter, number>;

  for (const user of users) {
    for (const key of ADMIN_USERS_FILTERS) {
      if (matchesAdminUsersFilter(user, key, ctx)) {
        counts[key] += 1;
      }
    }
  }

  return counts;
}

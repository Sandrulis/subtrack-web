import type { NavUserDisplay } from "@/lib/auth/user-display";
import { coercePgBool } from "@/lib/system-settings-public";

/** Admin konfigurācija no `system_settings`. */
export type ProTrialConfig = {
  enabled: boolean;
  days: number;
};

export type ProTrialUserFields = Pick<
  NavUserDisplay,
  "paidPlanActive" | "proVip" | "proTrialUsed" | "proTrialStartedAt"
>;

export type ProTrialProgress = {
  daysRemaining: number;
  daysTotal: number;
  /** 0 = tikko sācies, 100 = izmēģinājuma periods iztērēts (reģistrācija + dienas). */
  percentElapsed: number;
  /** Reģistrācijas / izmēģinājuma sākuma datums (formatēts serverī). */
  startsOnFormatted: string;
  /** Pēdējā aktīvā diena (formatēta serverī pēc `display_preferences`). */
  endsOnFormatted: string;
  /** ISO sākums (informācijai / aria). */
  startedAtIso: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isProTrialGrantEligible(
  user: ProTrialUserFields | null | undefined,
  options: { paidPlanEnabled: boolean; trial: ProTrialConfig },
): boolean {
  if (!options.paidPlanEnabled || !options.trial.enabled || options.trial.days < 1) {
    return false;
  }
  if (user?.paidPlanActive === true || user?.proVip === true) return false;
  if (user?.proTrialUsed === true) return false;
  return true;
}

export function normalizeProTrialConfig(data: unknown): ProTrialConfig {
  if (!data || typeof data !== "object") {
    return { enabled: false, days: 14 };
  }
  const r = data as Record<string, unknown>;
  const enabled = coercePgBool(r.pro_trial_enabled);
  const daysRaw = r.pro_trial_days;
  const days =
    typeof daysRaw === "number"
      ? Math.trunc(daysRaw)
      : typeof daysRaw === "string"
        ? Number.parseInt(daysRaw, 10)
        : NaN;
  return {
    enabled,
    days: Number.isFinite(days) ? Math.min(365, Math.max(1, days)) : 14,
  };
}

export function isProTrialActive(
  user: ProTrialUserFields | null | undefined,
  config: ProTrialConfig,
  options?: { paidPlanEnabled?: boolean },
): boolean {
  if (options?.paidPlanEnabled === false) return false;
  if (!config.enabled || config.days < 1) return false;
  if (user?.paidPlanActive === true || user?.proVip === true) return false;
  if (user?.proTrialUsed !== true || !user.proTrialStartedAt) return false;

  const started = new Date(user.proTrialStartedAt);
  if (Number.isNaN(started.getTime())) return false;

  const endMs = started.getTime() + config.days * MS_PER_DAY;
  return Date.now() < endMs;
}

/** Beigu brīdis: `started_at` + `days` (tas pats slieksnis kā `isProTrialActive`). */
export function getProTrialEndInstant(
  startedAtIso: string,
  daysTotal: number,
): Date | null {
  const started = new Date(startedAtIso);
  if (Number.isNaN(started.getTime()) || daysTotal < 1) return null;
  return new Date(started.getTime() + daysTotal * MS_PER_DAY);
}

export function computeProTrialProgress(
  user: ProTrialUserFields | null | undefined,
  config: ProTrialConfig,
  formatDate: (instant: Date) => string,
): ProTrialProgress | null {
  if (!isProTrialActive(user, config)) return null;
  if (!user?.proTrialStartedAt) return null;

  const started = new Date(user.proTrialStartedAt);
  const daysTotal = config.days;
  const totalMs = daysTotal * MS_PER_DAY;
  const elapsedMs = Math.max(0, Date.now() - started.getTime());
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / MS_PER_DAY));
  const percentElapsed = Math.min(
    100,
    Math.max(0, Math.round((elapsedMs / totalMs) * 100)),
  );

  const endInstant = getProTrialEndInstant(user.proTrialStartedAt, daysTotal);
  if (!endInstant) return null;

  // Pēdējā pilnā diena pirms termiņa (līdz šim datumam kalendārā).
  const lastActiveDay = new Date(endInstant.getTime() - 1);

  return {
    daysRemaining,
    daysTotal,
    percentElapsed,
    startsOnFormatted: formatDate(started),
    endsOnFormatted: formatDate(lastActiveDay),
    startedAtIso: started.toISOString(),
  };
}

export function userRowHasProEntitlement(
  row: {
    paid_plan_active?: boolean | null;
    pro_vip?: boolean | null;
    pro_trial_used?: boolean | null;
    pro_trial_started_at?: string | null;
  } | null
  | undefined,
  trialConfig: ProTrialConfig,
  options?: { paidPlanEnabled?: boolean },
): boolean {
  if (!row) return false;
  if (row.paid_plan_active === true || row.pro_vip === true) return true;
  return isProTrialActive(
    {
      paidPlanActive: false,
      proVip: false,
      proTrialUsed: row.pro_trial_used === true,
      proTrialStartedAt: row.pro_trial_started_at ?? null,
    },
    trialConfig,
    options,
  );
}

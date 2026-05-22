import {
  isProTrialGrantEligible,
  normalizeProTrialConfig,
  type ProTrialConfig,
  type ProTrialUserFields,
} from "@/lib/auth/pro-trial-access";
import { coercePgBool } from "@/lib/system-settings-public";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";

/**
 * Esošam kontam: piešķir Pro izmēģinājumu caur RPC (tikai serverī, service_role).
 * Pēc migrācijas 116: EXECUTE nav pieejams authenticated (Security Advisor).
 */
export async function maybeGrantProTrialForSession(
  user: ProTrialUserFields,
  sysRow: unknown,
  userId: string,
): Promise<boolean> {
  const paidPlanEnabled =
    sysRow && typeof sysRow === "object"
      ? coercePgBool((sysRow as { paid_plan_enabled?: unknown }).paid_plan_enabled)
      : false;
  const trial = normalizeProTrialConfig(sysRow);

  if (!isProTrialGrantEligible(user, { paidPlanEnabled, trial })) {
    return false;
  }

  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    return false;
  }

  const { data, error } = await svc.rpc("grant_pro_trial_if_eligible", {
    p_user_id: userId,
  });
  if (error) {
    if (/grant_pro_trial_if_eligible|schema cache/i.test(error.message)) {
      return false;
    }
    return false;
  }

  return data === true;
}

/** Labo `pro_trial_started_at` uz `created_at` (service_role, p_user_id). */
export async function maybeRepairProTrialStartedAt(userId: string): Promise<boolean> {
  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    return false;
  }

  const { data, error } = await svc.rpc("repair_pro_trial_started_at", {
    p_user_id: userId,
  });
  if (error) {
    if (/repair_pro_trial_started_at|schema cache/i.test(error.message)) {
      return false;
    }
    return false;
  }
  return data === true;
}

export function readPaidPlanEnabledFromSettings(sysRow: unknown): boolean {
  if (!sysRow || typeof sysRow !== "object") return false;
  return coercePgBool((sysRow as { paid_plan_enabled?: unknown }).paid_plan_enabled);
}

export type SessionTrialSettings = {
  paidPlanEnabled: boolean;
  trial: ProTrialConfig;
};

export function sessionTrialSettingsFromRow(sysRow: unknown): SessionTrialSettings {
  return {
    paidPlanEnabled: readPaidPlanEnabledFromSettings(sysRow),
    trial: normalizeProTrialConfig(sysRow),
  };
}

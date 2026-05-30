import { cache } from "react";
import { normalizeProTrialConfig } from "@/lib/auth/pro-trial-access";
import { normalizePaidPlanLifetimeAdminRow } from "@/lib/paid-plan-lifetime";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import { normalizePaidPlanRow } from "@/lib/system-settings-public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
  sanitizeDisplayPreferencesPartial,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";
import type { ProTrialConfig } from "@/lib/auth/pro-trial-access";
import type { PaidPlanLifetimeConfig } from "@/lib/paid-plan-lifetime";
import type { SubtrackPublicPaidPlan } from "@/lib/system-settings-public";

export type AdminSystemPageData = {
  loadError: string | null;
  initialSystemName: string;
  initialSupportContactEmail: string;
  initialLogoRevision: number;
  initialDefaults: DisplayPreferences;
  initialPaidPlan: SubtrackPublicPaidPlan;
  initialProTrial: ProTrialConfig;
  initialPaidPlanLifetime: PaidPlanLifetimeConfig;
};

export const loadAdminSystemPageData = cache(async (): Promise<AdminSystemPageData> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select(
      "system_name, logo_revision, support_contact_email, default_display_preferences, paid_plan_enabled, paid_plan_price_eur, paid_plan_free_subscription_limit, paid_plan_annual_enabled, paid_plan_annual_price_eur, paid_plan_lifetime_enabled, paid_plan_lifetime_price_eur, paid_plan_lifetime_ends_at, paid_plan_lifetime_purchase_limit, paid_plan_lifetime_purchase_count, pro_trial_enabled, pro_trial_days",
    )
    .eq("id", 1)
    .maybeSingle();

  const partial = sanitizeDisplayPreferencesPartial(data?.default_display_preferences);
  const initialDefaults = mergeDisplayPreferences(partial, DISPLAY_PREFERENCES_DEFAULTS);
  const initialSystemName =
    typeof data?.system_name === "string" && data.system_name.trim()
      ? data.system_name.trim()
      : DEFAULT_SYSTEM_NAME;

  const logoRevisionRaw = data?.logo_revision;
  const initialLogoRevision =
    typeof logoRevisionRaw === "number"
      ? Math.max(0, Math.trunc(logoRevisionRaw))
      : Number.parseInt(String(logoRevisionRaw ?? "0"), 10) || 0;

  return {
    loadError: error?.message ?? null,
    initialSystemName,
    initialSupportContactEmail:
      typeof data?.support_contact_email === "string"
        ? data.support_contact_email.trim()
        : "",
    initialLogoRevision,
    initialDefaults,
    initialPaidPlan: normalizePaidPlanRow(data),
    initialProTrial: normalizeProTrialConfig(data),
    initialPaidPlanLifetime: normalizePaidPlanLifetimeAdminRow(data),
  };
});

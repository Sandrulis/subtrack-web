import type { Metadata } from "next";
import { AdminSystemIntro } from "@/components/admin/admin-intros";
import { AdminSystemPanel } from "@/components/admin/admin-system-panel";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
  sanitizeDisplayPreferencesPartial,
} from "@/lib/user-display-preferences";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import { normalizePaidPlanRow } from "@/lib/system-settings-public";
import { normalizePaidPlanLifetimeAdminRow } from "@/lib/paid-plan-lifetime";
import { normalizeProTrialConfig } from "@/lib/auth/pro-trial-access";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.system"),
  };
}

export default async function AdminSystemPage() {
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

  const initialPaidPlan = normalizePaidPlanRow(data);
  const initialPaidPlanLifetime = normalizePaidPlanLifetimeAdminRow(data);
  const initialProTrial = normalizeProTrialConfig(data);

  const initialSupportContactEmail =
    typeof data?.support_contact_email === "string"
      ? data.support_contact_email.trim()
      : "";

  const logoRevisionRaw = data?.logo_revision;
  const initialLogoRevision =
    typeof logoRevisionRaw === "number"
      ? Math.max(0, Math.trunc(logoRevisionRaw))
      : Number.parseInt(String(logoRevisionRaw ?? "0"), 10) || 0;

  return (
    <div className="admin-page">
      <AdminSystemIntro />
      <AdminSystemPanel
        loadError={error?.message ?? null}
        initialSystemName={initialSystemName}
        initialSupportContactEmail={initialSupportContactEmail}
        initialLogoRevision={initialLogoRevision}
        initialDefaults={initialDefaults}
        initialPaidPlan={initialPaidPlan}
        initialProTrial={initialProTrial}
        initialPaidPlanLifetime={initialPaidPlanLifetime}
      />
    </div>
  );
}

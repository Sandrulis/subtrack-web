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
import { normalizePaidPlanRow } from "@/lib/system-settings-public";

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
      "system_name, default_display_preferences, paid_plan_enabled, paid_plan_price_eur, paid_plan_free_subscription_limit",
    )
    .eq("id", 1)
    .maybeSingle();

  const partial = sanitizeDisplayPreferencesPartial(data?.default_display_preferences);
  const initialDefaults = mergeDisplayPreferences(partial, DISPLAY_PREFERENCES_DEFAULTS);
  const initialSystemName =
    typeof data?.system_name === "string" && data.system_name.trim()
      ? data.system_name.trim()
      : "SubTrack";

  const initialPaidPlan = normalizePaidPlanRow(data);

  return (
    <div className="admin-page">
      <AdminSystemIntro />
      <AdminSystemPanel
        loadError={error?.message ?? null}
        initialSystemName={initialSystemName}
        initialDefaults={initialDefaults}
        initialPaidPlan={initialPaidPlan}
      />
    </div>
  );
}

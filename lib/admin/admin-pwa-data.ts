import { cache } from "react";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import { normalizePwaRow, type PublicPwaSettings } from "@/lib/pwa/public-pwa-settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminPwaPageData = {
  loadError: string | null;
  initial: PublicPwaSettings;
  updatedAt: string | null;
};

export const loadAdminPwaPageData = cache(async (): Promise<AdminPwaPageData> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select(
      "system_name, pwa_enabled, pwa_install_banner_enabled, pwa_install_settings_enabled, pwa_cache_revision, pwa_theme_color, pwa_background_color, pwa_short_name, updated_at",
    )
    .eq("id", 1)
    .maybeSingle();

  const systemName =
    typeof data?.system_name === "string" && data.system_name.trim()
      ? data.system_name.trim()
      : DEFAULT_SYSTEM_NAME;

  return {
    loadError: error?.message ?? null,
    initial: normalizePwaRow(data, systemName),
    updatedAt: typeof data?.updated_at === "string" ? data.updated_at : null,
  };
});

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
  sanitizeDisplayPreferencesPartial,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";

export type PublicSystemSettings = {
  systemName: string;
  /** Pilns `DisplayPreferences`: koda `DISPLAY_PREFERENCES_DEFAULTS` + `default_display_preferences` no DB */
  displayPreferenceDefaults: DisplayPreferences;
};

async function fetchPublicSystemSettings(): Promise<PublicSystemSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return {
      systemName: "SubTrack",
      displayPreferenceDefaults: DISPLAY_PREFERENCES_DEFAULTS,
    };
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("system_settings")
    .select("system_name, default_display_preferences")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return {
      systemName: "SubTrack",
      displayPreferenceDefaults: DISPLAY_PREFERENCES_DEFAULTS,
    };
  }

  const systemNameRaw = String((data as { system_name?: string }).system_name ?? "").trim();
  const systemName = systemNameRaw || "SubTrack";
  const partial = sanitizeDisplayPreferencesPartial(
    (data as { default_display_preferences?: unknown }).default_display_preferences,
  );
  const displayPreferenceDefaults = mergeDisplayPreferences(
    partial,
    DISPLAY_PREFERENCES_DEFAULTS,
  );

  return { systemName, displayPreferenceDefaults };
}

/**
 * Publiski lasāmi sistēmas parametri (anon atslēga + RLS).
 * Pēc `/admin/system` saglabāšanas: `revalidateTag("system-settings")`.
 */
export async function getPublicSystemSettings(): Promise<PublicSystemSettings> {
  return unstable_cache(fetchPublicSystemSettings, ["subtrack-system-settings-v1"], {
    revalidate: 3600,
    tags: ["system-settings"],
  })();
}

/** Viens izsaukums uz pieprasījumu (`generateMetadata` + layout). */
export const getSystemSiteName = cache(async (): Promise<string> => {
  const s = await getPublicSystemSettings();
  return s.systemName;
});

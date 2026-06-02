import { cache } from "react";
import { normalizeSignupEnabledRow } from "@/lib/system-settings-public";
import { createPublicAnonSupabaseClient } from "@/lib/supabase/public-anon-client";

export { normalizeSignupEnabledRow } from "@/lib/system-settings-public";

/** Publiskā `system_settings.signup_enabled` (noklusējums: atļauts). */
export const getPublicSignupEnabled = cache(async (): Promise<boolean> => {
  const supabase = createPublicAnonSupabaseClient();
  if (!supabase) return true;

  const { data, error } = await supabase
    .from("system_settings")
    .select("signup_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return true;
  return normalizeSignupEnabledRow(data);
});

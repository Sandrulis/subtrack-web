"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { DisplayPreferences } from "@/lib/user-display-preferences";

export type UpdateSessionDisplayPreferencesResult =
  | { ok: true }
  | { ok: false; reason: "no_user" | "db_error"; message?: string };

/** Saglabā pilnu `display_preferences` objektu ielogotam lietotājam. */
export async function updateSessionDisplayPreferences(
  snapshot: DisplayPreferences,
): Promise<UpdateSessionDisplayPreferencesResult> {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, reason: "no_user" };
  }

  const { error } = await supabase
    .from("users")
    .update({ display_preferences: snapshot })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      reason: "db_error",
      message: (error.message || "").trim() || undefined,
    };
  }

  return { ok: true };
}

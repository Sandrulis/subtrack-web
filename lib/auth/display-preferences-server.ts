import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Lasīšana serverim: `public.users.display_preferences` (jsonb).
 * Atgriež `null`, ja kolonna ir null vai nav rindas – klients var kombinēt ar localStorage.
 */
export async function getSessionDisplayPreferencesRow(): Promise<unknown | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("users")
    .select("display_preferences")
    .eq("id", user.id)
    .maybeSingle();

  return row?.display_preferences ?? null;
}

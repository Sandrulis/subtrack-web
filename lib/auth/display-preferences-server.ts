import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { sanitizeDisplayPreferencesPartial } from "@/lib/user-display-preferences";

/**
 * Lasīšana serverim: `public.users.display_preferences` (jsonb).
 * Atgriež `null`, ja kolonna ir null vai nav rindas – klients var kombinēt ar localStorage.
 */
export async function getSessionDisplayPreferencesRow(): Promise<unknown | null> {
  const { supabase, user } = await loadAuthContext();
  if (!user) return null;

  const { data: row } = await supabase
    .from("users")
    .select("display_preferences")
    .eq("id", user.id)
    .maybeSingle();

  return row?.display_preferences ?? null;
}

/** `languages.code` no profila; `null`, ja nav ielogots vai lauks nav iestatīts. */
export async function getSessionInterfaceLanguageCode(): Promise<string | null> {
  const raw = await getSessionDisplayPreferencesRow();
  const partial = sanitizeDisplayPreferencesPartial(raw);
  return partial.interface_language_code ?? null;
}

export async function getSessionInterfaceLanguageUserSet(): Promise<boolean> {
  const raw = await getSessionDisplayPreferencesRow();
  const partial = sanitizeDisplayPreferencesPartial(raw);
  return partial.interface_language_user_set === true;
}

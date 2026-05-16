import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Vai pašreizējā Supabase sesija ir administrators (public.users.is_admin > 0).
 * Primāri RPC ar SECURITY DEFINER, lai darbotos pat tad, ja users SELECT politikas
 * kombinācija (piem. users_select_all_if_admin) rada RLS apakšvaicājumu konfliktus.
 */
export async function resolveSessionIsAdmin(
  supabase: SupabaseClient,
  rowFallback?: { is_admin?: unknown } | null,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("current_user_is_admin");
  if (!error && typeof data === "boolean") {
    return data;
  }

  const raw = rowFallback?.is_admin;
  return typeof raw === "number"
    ? raw > 0
    : Number(raw ?? 0) > 0;
}

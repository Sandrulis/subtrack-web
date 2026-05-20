import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Viens RPC izsaukums uz vienu Supabase klienta instanci vienā servera renderī. */
const rpcCurrentUserIsAdmin = cache(async (supabase: SupabaseClient) => {
  return supabase.rpc("current_user_is_admin");
});

/**
 * Vai pašreizējā Supabase sesija ir administrators (public.users.is_admin > 0).
 * Primāri RPC `current_user_is_admin` (pēc `023` – SECURITY INVOKER); rezerves – `users.is_admin` rinda.
 */
export async function resolveSessionIsAdmin(
  supabase: SupabaseClient,
  rowFallback?: { is_admin?: unknown } | null,
): Promise<boolean> {
  const { data, error } = await rpcCurrentUserIsAdmin(supabase);
  if (!error && typeof data === "boolean") {
    return data;
  }

  const raw = rowFallback?.is_admin;
  return typeof raw === "number"
    ? raw > 0
    : Number(raw ?? 0) > 0;
}

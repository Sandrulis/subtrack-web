import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Lomas atslēga serverim (`SUPABASE_SERVICE_ROLE_KEY`). Nekad nepadod klientam / RSC props.
 * Izmanto tikai Server Actions / Route Handlers, kur nepieciešams piekļūt RPC ar `service_role` tiesībām.
 */
export function createServiceRoleSupabaseClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const cfg = getSupabasePublicConfig();
  if (!cfg || !key) {
    return null;
  }

  return createClient(cfg.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

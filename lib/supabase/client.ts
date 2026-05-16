import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/** Pārlūka komponentiem (`use client`). */
export function createBrowserSupabaseClient() {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    throw new Error(
      "Trūkst NEXT_PUBLIC_SUPABASE_URL vai NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local).",
    );
  }
  return createBrowserClient(cfg.url, cfg.anonKey);
}

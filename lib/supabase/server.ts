import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Server komponentiem, Server Actions, Route Handlers.
 * Sesiju atjauno `middleware.ts` - šeit tikai lasīšana/rakstīšana ar sīkdatēm.
 */
export async function createServerSupabaseClient() {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    throw new Error(
      "Trūkst NEXT_PUBLIC_SUPABASE_URL vai NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local).",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component: setAll var izraisīt kļūdu - sesiju atjauno middleware.
        }
      },
    },
  });
}

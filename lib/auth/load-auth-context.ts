import { cache } from "react";
import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LoadedAuthContext = {
  supabase: SupabaseClient;
  user: User | null;
  authError: AuthError | null;
};

/**
 * Viens `createServerSupabaseClient` + `getUser()` uz RSC pieprasījumu.
 * Samazina dubultus izsaukumus starp `requireAdminUser`, `getSessionUserDisplay`, `fetchSubscriptionsForSession` utt.
 */
export const loadAuthContext = cache(async (): Promise<LoadedAuthContext> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return {
    supabase,
    user: user ?? null,
    authError: error,
  };
});

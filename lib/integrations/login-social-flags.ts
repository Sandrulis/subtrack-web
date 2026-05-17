import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LoginSocialIntegrationFlags = {
  googleEnabled: boolean;
  appleEnabled: boolean;
};

const OAUTH_KEYS = ["login_google", "login_apple"] as const;

/**
 * Nosaka, vai jārāda Google / Apple SSO pēc `public.integrations` ierakstiem `login_*` un `enabled`.
 */
export async function getLoginSocialIntegrationFlags(): Promise<LoginSocialIntegrationFlags> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("integrations")
      .select("integration_key, enabled")
      .in("integration_key", [...OAUTH_KEYS]);

    if (error || !data?.length) {
      return { googleEnabled: false, appleEnabled: false };
    }

    let googleEnabled = false;
    let appleEnabled = false;
    for (const row of data) {
      if (!row.enabled) continue;
      if (row.integration_key === "login_google") googleEnabled = true;
      if (row.integration_key === "login_apple") appleEnabled = true;
    }

    return { googleEnabled, appleEnabled };
  } catch {
    return { googleEnabled: false, appleEnabled: false };
  }
}

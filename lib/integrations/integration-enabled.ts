import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Vai `public.integrations` ieraksts ar atslēgu ir ieslēgts (SELECT publisks).
 */
export async function isIntegrationEnabled(integrationKey: string): Promise<boolean> {
  const key = integrationKey.trim().toLowerCase();
  if (!key) return false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("integrations")
      .select("enabled")
      .eq("integration_key", key)
      .maybeSingle();

    if (error || !data) return false;
    return data.enabled === true;
  } catch {
    return false;
  }
}

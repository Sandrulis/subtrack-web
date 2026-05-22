import {
  normalizeStoredEmailTemplates,
  sanitizeEmailTemplatesStore,
} from "@/lib/emails/merge-template-copy";
import type { EmailTemplatesStore } from "@/lib/emails/template-types";
import { getSystemSiteName } from "@/lib/system-settings-public";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";

export async function loadEmailTemplatesStoreForSend(): Promise<{
  store: EmailTemplatesStore;
  systemName: string;
} | null> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return null;

  const [systemName, { data, error }] = await Promise.all([
    getSystemSiteName(),
    supabase
      .from("system_settings_email_templates")
      .select("email_templates")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (error) return null;

  const store = normalizeStoredEmailTemplates(
    sanitizeEmailTemplatesStore(data?.email_templates),
    systemName,
  );

  return { store, systemName };
}

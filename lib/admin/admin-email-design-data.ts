import { cache } from "react";
import { EMAIL_SUPPORTED_LOCALES } from "@/lib/emails/template-types";
import {
  normalizeStoredEmailTemplates,
  sanitizeEmailTemplatesStore,
} from "@/lib/emails/merge-template-copy";
import { isTransactionalEmailConfigured } from "@/lib/emails/send-transactional";
import { getSystemSiteName } from "@/lib/system-settings-public";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminEmailDesignLocaleOption = {
  code: string;
  label: string;
};

export type AdminEmailDesignPageData = {
  loadError: string | null;
  initialSystemName: string;
  initialStore: ReturnType<typeof normalizeStoredEmailTemplates>;
  siteUrl: string;
  resendConfigured: boolean;
  localeOptions: AdminEmailDesignLocaleOption[];
  systemDisplayPreferences: unknown;
};

export const loadAdminEmailDesignPageData = cache(
  async (): Promise<AdminEmailDesignPageData> => {
    const supabase = await createServerSupabaseClient();
    const [{ data, error }, { data: langRows }, { data: settingsRow }] =
      await Promise.all([
        supabase
          .from("system_settings_email_templates")
          .select("email_templates")
          .eq("id", 1)
          .maybeSingle(),
        supabase.from("languages").select("code, label").order("sort_order", { ascending: true }),
        supabase
          .from("system_settings")
          .select("default_display_preferences")
          .eq("id", 1)
          .maybeSingle(),
      ]);

    const localeOptions =
      langRows && langRows.length > 0
        ? langRows.map((row) => ({
            code: String(row.code).trim().toLowerCase(),
            label: String(row.label).trim() || String(row.code).toUpperCase(),
          }))
        : EMAIL_SUPPORTED_LOCALES.map((code) => ({ code, label: code.toUpperCase() }));

    const initialSystemName = await getSystemSiteName();
    const initialStore = normalizeStoredEmailTemplates(
      sanitizeEmailTemplatesStore(data?.email_templates),
      initialSystemName,
    );

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

    return {
      loadError: error?.message ?? null,
      initialSystemName,
      initialStore,
      siteUrl,
      resendConfigured: isTransactionalEmailConfigured(),
      localeOptions,
      systemDisplayPreferences: settingsRow?.default_display_preferences ?? null,
    };
  },
);

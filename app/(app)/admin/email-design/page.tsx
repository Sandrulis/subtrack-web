import type { Metadata } from "next";
import { AdminEmailDesignIntro } from "@/components/admin/admin-intros";
import { AdminEmailDesignPanel } from "@/components/admin/admin-email-design-panel";
import { EMAIL_SUPPORTED_LOCALES } from "@/lib/emails/template-types";
import {
  normalizeStoredEmailTemplates,
  sanitizeEmailTemplatesStore,
} from "@/lib/emails/merge-template-copy";
import { isTransactionalEmailConfigured } from "@/lib/emails/send-transactional";
import { getSystemSiteName } from "@/lib/system-settings-public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.email_design"),
  };
}

export default async function AdminEmailDesignPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data, error }, { data: langRows }] = await Promise.all([
    supabase
      .from("system_settings_email_templates")
      .select("email_templates")
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("languages").select("code, label").order("sort_order", { ascending: true }),
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

  return (
    <div className="admin-page">
      <AdminEmailDesignIntro />
      <AdminEmailDesignPanel
        loadError={error?.message ?? null}
        initialSystemName={initialSystemName}
        initialStore={initialStore}
        siteUrl={siteUrl}
        resendConfigured={isTransactionalEmailConfigured()}
        localeOptions={localeOptions}
      />
    </div>
  );
}

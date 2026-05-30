import type { Metadata } from "next";
import { AdminEmailDesignIntro } from "@/components/admin/admin-intros";
import { AdminEmailDesignPanel } from "@/components/admin/admin-email-design-panel";
import { loadAdminEmailDesignPageData } from "@/lib/admin/admin-email-design-data";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.email_design"),
  };
}

export default async function AdminEmailDesignPage() {
  const data = await loadAdminEmailDesignPageData();

  return (
    <div className="admin-page">
      <AdminEmailDesignIntro />
      <AdminEmailDesignPanel
        loadError={data.loadError}
        initialSystemName={data.initialSystemName}
        initialStore={data.initialStore}
        siteUrl={data.siteUrl}
        resendConfigured={data.resendConfigured}
        localeOptions={data.localeOptions}
        systemDisplayPreferences={data.systemDisplayPreferences}
      />
    </div>
  );
}

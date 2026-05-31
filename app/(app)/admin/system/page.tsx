import type { Metadata } from "next";
import { AdminSystemIntro } from "@/components/admin/admin-intros";
import { AdminSystemPanel } from "@/components/admin/admin-system-panel";
import { loadAdminSystemPageData } from "@/lib/admin/admin-system-data";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.system"),
  };
}

export default async function AdminSystemPage() {
  const data = await loadAdminSystemPageData();

  return (
    <div className="admin-page">
      <AdminSystemIntro />
      <AdminSystemPanel
        loadError={data.loadError}
        initialSystemName={data.initialSystemName}
        initialSupportContactEmail={data.initialSupportContactEmail}
        initialLogoRevision={data.initialLogoRevision}
        initialTopbarLogoRevision={data.initialTopbarLogoRevision}
        initialDefaults={data.initialDefaults}
        initialPaidPlan={data.initialPaidPlan}
        initialProTrial={data.initialProTrial}
        initialPaidPlanLifetime={data.initialPaidPlanLifetime}
      />
    </div>
  );
}

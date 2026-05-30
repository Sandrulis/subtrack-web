import type { Metadata } from "next";
import { AdminIntegrationsIntro } from "@/components/admin/admin-intros";
import { AdminIntegrationsPanel } from "@/components/admin/admin-integrations-panel";
import { loadAdminIntegrationsPageData } from "@/lib/admin/admin-integrations-data";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.integrations"),
  };
}

export default async function AdminIntegrationsPage() {
  const { rows, loadError } = await loadAdminIntegrationsPageData();

  return (
    <div className="admin-page">
      <AdminIntegrationsIntro />
      <AdminIntegrationsPanel rows={rows} loadError={loadError} />
    </div>
  );
}

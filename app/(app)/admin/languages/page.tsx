import type { Metadata } from "next";
import { AdminLanguagesIntro } from "@/components/admin/admin-intros";
import { AdminLanguagesPanel } from "@/components/admin/admin-languages-panel";
import { loadAdminLanguagesPageData } from "@/lib/admin/admin-languages-data";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.languages"),
  };
}

export default async function AdminLanguagesPage() {
  const { rows, loadError } = await loadAdminLanguagesPageData();

  return (
    <div className="admin-page">
      <AdminLanguagesIntro />
      <AdminLanguagesPanel rows={rows} loadError={loadError} />
    </div>
  );
}

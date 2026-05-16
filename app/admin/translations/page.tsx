import type { Metadata } from "next";
import { AdminTranslationsPanel } from "@/components/admin/admin-translations-panel";
import { loadAdminTranslationsData } from "@/lib/admin/admin-translations-data";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.translations"),
  };
}

export default async function AdminTranslationsPage() {
  const { languages, rows, loadError } = await loadAdminTranslationsData();

  return (
    <div className="admin-page">
      <AdminTranslationsPanel languages={languages} rows={rows} loadError={loadError} />
    </div>
  );
}

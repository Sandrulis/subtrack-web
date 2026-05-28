import type { Metadata } from "next";
import { AdminCategoriesIntro } from "@/components/admin/admin-intros";
import { AdminCategoriesPanel } from "@/components/admin/admin-categories-panel";
import { loadAdminCategoriesPageData } from "@/lib/admin/admin-categories-data";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.categories"),
  };
}

export default async function AdminCategoriesPage() {
  const { rows, languages, defaultLocaleCode, loadError } =
    await loadAdminCategoriesPageData();

  return (
    <div className="admin-page">
      <AdminCategoriesIntro />
      <AdminCategoriesPanel
        rows={rows}
        languages={languages}
        defaultLocaleCode={defaultLocaleCode}
        loadError={loadError}
      />
    </div>
  );
}

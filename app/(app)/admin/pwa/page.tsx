import type { Metadata } from "next";
import { AdminPwaIntro } from "@/components/admin/admin-intros";
import { AdminPwaPanel } from "@/components/admin/admin-pwa-panel";
import { loadAdminPwaPageData } from "@/lib/admin/admin-pwa-data";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.pwa"),
  };
}

export default async function AdminPwaPage() {
  const { loadError, initial, updatedAt } = await loadAdminPwaPageData();

  return (
    <div className="admin-page">
      <AdminPwaIntro />
      <AdminPwaPanel loadError={loadError} initial={initial} updatedAt={updatedAt} />
    </div>
  );
}

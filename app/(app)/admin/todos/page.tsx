import type { Metadata } from "next";
import { AdminTodosBoard } from "@/components/admin/admin-todos-board";
import { loadAdminTodosForPage } from "@/lib/admin/admin-todos-actions";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.todos"),
  };
}

export default async function AdminTodosPage() {
  const { rows, loadError } = await loadAdminTodosForPage();

  return (
    <div className="admin-page admin-todos-page">
      <AdminTodosBoard initialRows={rows} loadError={loadError} />
    </div>
  );
}

import type { Metadata } from "next";
import { AdminTodosBoardDynamic } from "@/components/admin/admin-todos-board-dynamic";
import { loadAdminTodosForPage } from "@/lib/admin/admin-todos-data";
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
      <AdminTodosBoardDynamic initialRows={rows} loadError={loadError} />
    </div>
  );
}

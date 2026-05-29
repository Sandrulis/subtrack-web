import type { Metadata } from "next";
import { AdminBlogPanel } from "@/components/admin/admin-blog-panel";
import { loadAdminBlogPostsForPage } from "@/lib/admin/blog-actions";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.blog"),
  };
}

export default async function AdminBlogPage() {
  const { rows, loadError } = await loadAdminBlogPostsForPage();

  return (
    <div className="admin-page admin-blog-page">
      <AdminBlogPanel initialRows={rows} loadError={loadError} />
    </div>
  );
}

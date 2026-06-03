import type { Metadata } from "next";
import { AdminUserMessagesViewDynamic } from "@/components/admin/admin-user-messages-view-dynamic";
import { loadAdminUserMessagesPageData } from "@/lib/admin/admin-user-messages-data";
import { parseAdminUserMessageTab } from "@/lib/admin/admin-user-messages-types";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.user_messages"),
  };
}

export default async function AdminUserMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const initialTab = parseAdminUserMessageTab(sp.tab);
  const data = await loadAdminUserMessagesPageData();

  return (
    <div className="admin-page admin-user-messages-page admin-lang-stack">
      <AdminUserMessagesViewDynamic
        suggestions={data.suggestions}
        feedback={data.feedback}
        supportRequests={data.supportRequests}
        loadError={data.loadError}
        initialTab={initialTab}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import { loadAdminUsersPageData } from "@/lib/admin/admin-users-data";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.users"),
  };
}

export default async function AdminUsersPage() {
  const data = await loadAdminUsersPageData();

  return (
    <AdminUsersView
      users={data.users}
      countsByUserId={data.countsByUserId}
      paidPlanEnabled={data.paidPlanEnabled}
      proTrial={data.proTrial}
      currentUserId={data.currentUserId}
      fetchError={data.fetchError}
      subscriptionsFetchError={data.subscriptionsFetchError}
    />
  );
}

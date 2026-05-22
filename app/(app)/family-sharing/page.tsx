import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FamilySharingView } from "@/components/family-sharing/family-sharing-view";
import { FsNotifyI18nBootstrap } from "@/components/fs/fs-notify-i18n-bootstrap";
import { fetchFamilySharingDashboardBootstrap } from "@/lib/family-sharing/family-sharing-server";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
import { fetchSubscriptionsForSession } from "@/lib/subscriptions/fetch-subscriptions-server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.family_sharing"),
  };
}

export default async function FamilySharingPage() {
  const enabled = await isIntegrationEnabled("family_sharing");
  if (!enabled) {
    redirect("/dashboard");
  }

  const [userDisplay, bootstrap, initialSubscriptions] = await Promise.all([
    getSessionUserDisplay(),
    fetchFamilySharingDashboardBootstrap(),
    fetchSubscriptionsForSession(),
  ]);

  if (!userDisplay) {
    redirect("/login?next=/family-sharing");
  }

  return (
    <>
      <FsNotifyI18nBootstrap />
      <FamilySharingView
        userDisplay={userDisplay}
        initialBootstrap={bootstrap}
        initialLinks={bootstrap.links}
        initialSubscriptions={initialSubscriptions}
      />
    </>
  );
}

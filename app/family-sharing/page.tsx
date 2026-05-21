import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FamilySharingView } from "@/components/family-sharing/family-sharing-view";
import {
  fetchFamilySharingDashboardBootstrap,
  fetchFamilySharingLinksForSession,
} from "@/lib/family-sharing/family-sharing-server";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
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

  const [userDisplay, bootstrap, links] = await Promise.all([
    getSessionUserDisplay(),
    fetchFamilySharingDashboardBootstrap(),
    fetchFamilySharingLinksForSession(),
  ]);

  if (!userDisplay) {
    redirect("/login?next=/family-sharing");
  }

  return (
    <FamilySharingView
      userDisplay={userDisplay}
      initialBootstrap={bootstrap}
      initialLinks={links}
    />
  );
}

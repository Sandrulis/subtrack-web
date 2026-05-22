import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SubscribeProView } from "@/components/subscribe-pro-view";
import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { fetchSystemPaidPlanLiveForDashboard } from "@/lib/subscriptions/dashboard-free-tier-gate";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.subscribe"),
  };
}

/**
 * Pro abonementa iepazīšanās lapa. Pieejama tikai ielogotam lietotājam un tikai ja
 * admin ir ieslēdzis `paid_plan_enabled` (sīkāk `fetchSystemPaidPlanLiveForDashboard`).
 */
export default async function SubscribePage() {
  const paid = await fetchSystemPaidPlanLiveForDashboard();
  if (!paid.enabled) {
    redirect("/dashboard");
  }

  const userDisplay = await getSessionUserDisplay();
  if (navUserHasProEntitlement(userDisplay)) {
    redirect("/dashboard");
  }

  return (
    <SubscribeProView
      userDisplay={userDisplay}
      priceEur={paid.priceEur}
      freeTierLimit={paid.freeSubscriptionLimit}
    />
  );
}

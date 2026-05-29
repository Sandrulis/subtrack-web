import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SubscribeProView } from "@/components/subscribe-pro-view";
import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { fetchSystemPaidPlanLiveForDashboard } from "@/lib/subscriptions/dashboard-free-tier-gate";
import { paidPlanShowsLifetime } from "@/lib/paid-plan-lifetime";
import { resolveSessionUserBillingCurrency } from "@/lib/billing/resolve-billing-currency";
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
  if (!userDisplay) {
    redirect("/login");
  }
  if (navUserHasProEntitlement(userDisplay)) {
    redirect("/dashboard");
  }

  const { user } = await loadAuthContext();
  const billingCurrency = user?.id
    ? await resolveSessionUserBillingCurrency(user.id)
    : "EUR";

  const lifetime =
    paidPlanShowsLifetime(paid.lifetime) && paid.lifetime.priceEur != null
      ? {
          priceEur: paid.lifetime.priceEur,
          endsAt: paid.lifetime.endsAt,
          remainingMs: paid.lifetime.remainingMs,
          purchasesRemaining: paid.lifetime.purchasesRemaining,
        }
      : null;

  return (
    <SubscribeProView
      userDisplay={userDisplay}
      priceEur={paid.priceEur}
      freeTierLimit={paid.freeSubscriptionLimit}
      annualPriceEur={
        paid.annualBillingEnabled ? paid.annualPriceEur : null
      }
      lifetime={lifetime}
      billingCurrency={billingCurrency}
    />
  );
}

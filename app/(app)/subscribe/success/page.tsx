import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NavDash } from "@/components/nav-dash";
import { SubscribeProTrackPrompt } from "@/components/subscribe-pro-track-prompt";
import { SubscribeSuccessBillingSync } from "@/components/subscribe-success-billing-sync";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import {
  isProTrackPlan,
  PRO_MEMBERSHIP_TRACK_NOTE,
  proTrackPlanFromSubscribe,
  resolveProTrackAmountEur,
} from "@/lib/billing/pro-track-subscription";
import { isSubscribePlanType } from "@/lib/billing/subscribe-plan-type";
import { fetchSystemPaidPlanLiveForDashboard } from "@/lib/subscriptions/dashboard-free-tier-gate";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveSessionUserBillingCurrency } from "@/lib/billing/resolve-billing-currency";
import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.subscribe_success"),
  };
}

type PageProps = {
  searchParams: Promise<{ plan?: string; session_id?: string }>;
};

export default async function SubscribeSuccessPage({ searchParams }: PageProps) {
  const paid = await fetchSystemPaidPlanLiveForDashboard();
  if (!paid.enabled) {
    redirect("/dashboard");
  }

  const userDisplay = await getSessionUserDisplay();
  if (!userDisplay) {
    redirect("/login");
  }

  const sp = await searchParams;
  const planRaw = isSubscribePlanType(sp.plan) ? sp.plan : null;
  const trackPlan = proTrackPlanFromSubscribe(planRaw);

  let showTrackPrompt = false;
  let trackAmountEur = 0;

  if (trackPlan) {
    const amount = resolveProTrackAmountEur(trackPlan, paid);
    if (amount != null) {
      trackAmountEur = amount;
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("note", PRO_MEMBERSHIP_TRACK_NOTE);
        showTrackPrompt = (count ?? 0) === 0;
      }
    }
  }

  const hasPro = navUserHasProEntitlement(userDisplay);
  const title = await getUiPhraseForRequest("subscribe.success.title");
  const lead = await getUiPhraseForRequest(
    hasPro ? "subscribe.success.lead_active" : "subscribe.success.lead_pending",
  );
  const cta = await getUiPhraseForRequest("subscribe.success.cta_dashboard");
  const { user } = await loadAuthContext();
  const currency = user?.id
    ? await resolveSessionUserBillingCurrency(user.id)
    : "EUR";

  const sessionId =
    typeof sp.session_id === "string" && sp.session_id.startsWith("cs_")
      ? sp.session_id.trim()
      : null;

  return (
    <div className="app-layout app-layout-stacked">
      <SubscribeSuccessBillingSync sessionId={sessionId} />
      <NavDash active="" userDisplay={userDisplay} />
      <main className="main-content subscribe-success-main">
        <div className="subscribe-success-card">
          <div className="subscribe-success-icon" aria-hidden="true">
            <i className="fa-solid fa-circle-check" />
          </div>
          <h1 className="subscribe-success-title">{title}</h1>
          <p className="subscribe-success-lead">{lead}</p>
          <Link href="/dashboard" className="btn btn-primary">
            {cta}
          </Link>
        </div>
      </main>
      {showTrackPrompt && trackPlan && isProTrackPlan(trackPlan) ? (
        <SubscribeProTrackPrompt
          plan={trackPlan}
          amountEur={trackAmountEur}
          currency={currency}
        />
      ) : null}
    </div>
  );
}

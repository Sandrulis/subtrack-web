import type { Metadata } from "next";
import { FsI18nBootstrap } from "@/components/fs/fs-i18n-bootstrap";
import { FsAnalyticsBootstrapTemplates } from "@/components/fs/fs-analytics-bootstrap-templates";
import { AnalyticsFsView } from "@/components/fs/analytics-fs-view";
import { loadNavBrandSnapshot } from "@/lib/brand/nav-brand-snapshot";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import {
  buildDashboardFreeTierGatePayload,
  fetchSystemPaidPlanLiveForDashboard,
} from "@/lib/subscriptions/dashboard-free-tier-gate";
import { fetchSubscriptionsForSession } from "@/lib/subscriptions/fetch-subscriptions-server";
import { fsAnalyticsPhraseKeys } from "@/lib/fs/fs-page-i18n-keys";
import {
  getUiPhraseForRequest,
  getUiPhrasesForRequest,
  resolveRequestUiLocales,
} from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.analytics"),
  };
}

export default async function AnalyticsPage() {
  const [userDisplay, paidPlanLive, brand] = await Promise.all([
    getSessionUserDisplay(),
    fetchSystemPaidPlanLiveForDashboard(),
    loadNavBrandSnapshot(),
  ]);
  const freeTierGate = buildDashboardFreeTierGatePayload(userDisplay, paidPlanLive);

  const initialSubscriptions = await fetchSubscriptionsForSession();
  const { locale } = await resolveRequestUiLocales();
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
  const fsI18n = await getUiPhrasesForRequest(fsAnalyticsPhraseKeys());

  return (
    <>
      <FsI18nBootstrap phrases={fsI18n} intlLocale={intlLocale} />
      <FsAnalyticsBootstrapTemplates
        initialSubscriptions={initialSubscriptions}
        freeTierGate={freeTierGate}
      />
      <AnalyticsFsView
        brand={brand}
        userDisplay={userDisplay}
        initialSubscriptions={initialSubscriptions}
        freeTierGate={freeTierGate}
      />
    </>
  );
}

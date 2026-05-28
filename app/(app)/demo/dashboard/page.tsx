import type { Metadata } from "next";
import { FsI18nBootstrap } from "@/components/fs/fs-i18n-bootstrap";
import { FsDashboardBootstrapTemplates } from "@/components/fs/fs-dashboard-bootstrap-templates";
import { DashboardFsView } from "@/components/fs/dashboard-fs-view";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";
import { DEMO_DASHBOARD_PHRASE_KEYS } from "@/lib/demo/demo-dashboard-phrase-keys";
import { buildDemoDashboardSubscriptions } from "@/lib/demo/demo-dashboard-subscriptions";
import {
  buildDashboardFreeTierGatePayload,
  fetchSystemPaidPlanLiveForDashboard,
} from "@/lib/subscriptions/dashboard-free-tier-gate";
import { fetchEnabledSubscriptionCategoryOptions } from "@/lib/subscriptions/subscription-categories-server";
import { fsDashboardPhraseKeys } from "@/lib/fs/fs-page-i18n-keys";
import {
  getUiPhraseForRequest,
  getUiPhrasesForRequest,
  resolveRequestUiLocales,
} from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";

const DEMO_SUB_PHRASE_KEYS = DEMO_DASHBOARD_PHRASE_KEYS;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.demo.dashboard"),
  };
}

export default async function DemoDashboardRoute() {
  const [userDisplay, paidPlanLive, demoPhrases] = await Promise.all([
    getSessionUserDisplaySafe(),
    fetchSystemPaidPlanLiveForDashboard(),
    getUiPhrasesForRequest(DEMO_SUB_PHRASE_KEYS),
  ]);

  const initialSubscriptions = buildDemoDashboardSubscriptions({
    sampleBillName: demoPhrases["landing.mock.sample_bill_name"],
    mortgageName: demoPhrases["demo.dashboard.sub_mortgage"],
    deviceWatchFemaleLabel: demoPhrases["demo.dashboard.device_watch_zane"],
    deviceWatchMaleLabel: demoPhrases["demo.dashboard.device_watch_sandris"],
    mockOdStreaming: demoPhrases["demo.dashboard.mock_od_streaming"],
    mockOdGym: demoPhrases["demo.dashboard.mock_od_gym"],
    mockTodayMeal: demoPhrases["demo.dashboard.mock_today_meal"],
    mockWeekBill: demoPhrases["demo.dashboard.mock_week_bill"],
  });

  const categoryOptions = await fetchEnabledSubscriptionCategoryOptions(
    initialSubscriptions.map((s) => s.category),
  );

  const freeTierGate = buildDashboardFreeTierGatePayload(
    userDisplay,
    paidPlanLive,
  );
  const demoFreeTierGate = {
    ...freeTierGate,
    enforcement: false,
    isPaidUser: true,
  };

  const { locale } = await resolveRequestUiLocales();
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
  const fsI18n = await getUiPhrasesForRequest(fsDashboardPhraseKeys());

  return (
    <>
      <FsI18nBootstrap phrases={fsI18n} intlLocale={intlLocale} />
      <FsDashboardBootstrapTemplates
        initialSubscriptions={initialSubscriptions}
        freeTierGate={demoFreeTierGate}
        categoryOptions={categoryOptions}
        demoMode
      />
      <DashboardFsView
        userDisplay={userDisplay}
        initialSubscriptions={initialSubscriptions}
        freeTierGate={demoFreeTierGate}
        categoryOptions={categoryOptions}
        demoMode
      />
    </>
  );
}

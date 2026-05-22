import type { Metadata } from "next";
import { FsI18nBootstrap } from "@/components/fs/fs-i18n-bootstrap";
import { FsDemoAnalyticsWindowFlag } from "@/components/fs/fs-demo-window-flags";
import { DemoAnalyticsPage } from "@/components/demo/demo-analytics-page";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";
import { buildDemoAnalyticsSnapshot } from "@/lib/demo/build-demo-analytics-snapshot";
import { buildDemoDashboardSubscriptions } from "@/lib/demo/demo-dashboard-subscriptions";
import { DEMO_DASHBOARD_PHRASE_KEYS } from "@/lib/demo/demo-dashboard-phrase-keys";
import {
  fsAnalyticsPhraseKeys,
  fsNotifyBarPhraseKeys,
} from "@/lib/fs/fs-page-i18n-keys";
import {
  getUiPhraseForRequest,
  getUiPhrasesForRequest,
  resolveRequestUiLocales,
} from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.demo.analytics"),
  };
}

export default async function DemoAnalyticsRoute() {
  const userDisplay = await getSessionUserDisplaySafe();
  const [demoPhrases, { locale }] = await Promise.all([
    getUiPhrasesForRequest(DEMO_DASHBOARD_PHRASE_KEYS),
    resolveRequestUiLocales(),
  ]);
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
  const formatMonthDay = (iso: string) =>
    new Intl.DateTimeFormat(intlLocale, {
      day: "numeric",
      month: "long",
    }).format(new Date(iso + "T00:00:00"));

  const subs = buildDemoDashboardSubscriptions({
    sampleBillName: demoPhrases["landing.mock.sample_bill_name"],
    mortgageName: demoPhrases["demo.dashboard.sub_mortgage"],
    deviceWatchFemaleLabel: demoPhrases["demo.dashboard.device_watch_zane"],
    deviceWatchMaleLabel: demoPhrases["demo.dashboard.device_watch_sandris"],
    mockOdStreaming: demoPhrases["demo.dashboard.mock_od_streaming"],
    mockOdGym: demoPhrases["demo.dashboard.mock_od_gym"],
    mockTodayMeal: demoPhrases["demo.dashboard.mock_today_meal"],
    mockWeekBill: demoPhrases["demo.dashboard.mock_week_bill"],
  });
  const analyticsSnapshot = buildDemoAnalyticsSnapshot(subs, formatMonthDay);

  const fsPhrasesNotify = await getUiPhrasesForRequest(fsNotifyBarPhraseKeys());
  const fsPhrasesAnalytics = await getUiPhrasesForRequest(fsAnalyticsPhraseKeys());
  const fsI18nMerged = { ...fsPhrasesNotify, ...fsPhrasesAnalytics };

  return (
    <>
      <FsDemoAnalyticsWindowFlag />
      <FsI18nBootstrap phrases={fsI18nMerged} intlLocale={intlLocale} />
      <template
        id="subtrack-subs-bootstrap-json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(subs).replace(/</g, "\\u003c"),
        }}
      />
      <DemoAnalyticsPage
        userDisplay={userDisplay}
        analyticsSnapshot={analyticsSnapshot}
      />
    </>
  );
}

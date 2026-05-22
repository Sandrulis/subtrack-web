import type { Metadata } from "next";
import { FsI18nBootstrap } from "@/components/fs/fs-i18n-bootstrap";
import { DashboardFsView } from "@/components/fs/dashboard-fs-view";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { fetchDashboardSubscriptionsWithFamilyShare } from "@/lib/family-sharing/family-sharing-server";
import { fetchPaidCalendarDaysForSession } from "@/lib/subscriptions/fetch-paid-calendar-server";
import {
  buildDashboardFreeTierGatePayload,
  fetchSystemPaidPlanLiveForDashboard,
} from "@/lib/subscriptions/dashboard-free-tier-gate";
import { fsDashboardPhraseKeys } from "@/lib/fs/fs-page-i18n-keys";
import {
  getUiPhraseForRequest,
  getUiPhrasesForRequest,
  resolveRequestUiLocales,
} from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.dashboard"),
  };
}

export default async function DashboardPage() {
  const [userDisplay, subsBundle, initialPaidCalendarDays, paidPlanLive] =
    await Promise.all([
      getSessionUserDisplay(),
      fetchDashboardSubscriptionsWithFamilyShare(),
      fetchPaidCalendarDaysForSession(),
      fetchSystemPaidPlanLiveForDashboard(),
    ]);
  const initialSubscriptions = subsBundle.subscriptions;
  const familySharingBootstrap = subsBundle.familyBootstrap;
  const freeTierGate = buildDashboardFreeTierGatePayload(userDisplay, paidPlanLive);
  const { locale } = await resolveRequestUiLocales();
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
  const fsI18n = await getUiPhrasesForRequest(fsDashboardPhraseKeys());

  return (
    <>
      <FsI18nBootstrap phrases={fsI18n} intlLocale={intlLocale} />
      <DashboardFsView
        userDisplay={userDisplay}
        initialSubscriptions={initialSubscriptions}
        initialPaidCalendarDays={initialPaidCalendarDays}
        familySharingBootstrap={familySharingBootstrap}
        freeTierGate={freeTierGate}
      />
    </>
  );
}

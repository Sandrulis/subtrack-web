import type { Metadata } from "next";
import { FsI18nBootstrap } from "@/components/fs/fs-i18n-bootstrap";
import { FsDashboardBootstrapTemplates } from "@/components/fs/fs-dashboard-bootstrap-templates";
import { DashboardFsView } from "@/components/fs/dashboard-fs-view";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { getSessionDisplayPreferencesRow } from "@/lib/auth/display-preferences-server";
import { fetchDashboardSubscriptionsWithFamilyShare } from "@/lib/family-sharing/family-sharing-server";
import { fetchEnabledSubscriptionCategoryOptions } from "@/lib/subscriptions/subscription-categories-server";
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
import {
  readMonthlyBudgetFromPreferences,
  sanitizeDisplayPreferencesPartial,
} from "@/lib/user-display-preferences";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.dashboard"),
  };
}

export default async function DashboardPage() {
  const [userDisplay, subsBundle, initialPaidCalendarDays, paidPlanLive, dbPreferencesRaw] =
    await Promise.all([
      getSessionUserDisplay(),
      fetchDashboardSubscriptionsWithFamilyShare(),
      fetchPaidCalendarDaysForSession(),
      fetchSystemPaidPlanLiveForDashboard(),
      getSessionDisplayPreferencesRow(),
    ]);
  const categoryOptions = await fetchEnabledSubscriptionCategoryOptions(
    subsBundle.subscriptions.map((s) => s.category),
  );
  const initialSubscriptions = subsBundle.subscriptions;
  const familySharingBootstrap = subsBundle.familyBootstrap;
  const freeTierGate = buildDashboardFreeTierGatePayload(userDisplay, paidPlanLive);
  const monthlyBudget = readMonthlyBudgetFromPreferences(
    sanitizeDisplayPreferencesPartial(dbPreferencesRaw),
  );
  const { locale } = await resolveRequestUiLocales();
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
  const fsI18n = await getUiPhrasesForRequest(fsDashboardPhraseKeys());

  return (
    <>
      <FsI18nBootstrap phrases={fsI18n} intlLocale={intlLocale} />
      <FsDashboardBootstrapTemplates
        initialSubscriptions={initialSubscriptions}
        initialPaidCalendarDays={initialPaidCalendarDays}
        familySharingBootstrap={familySharingBootstrap}
        freeTierGate={freeTierGate}
        categoryOptions={categoryOptions}
        monthlyBudget={monthlyBudget}
      />
      <DashboardFsView
        userDisplay={userDisplay}
        initialSubscriptions={initialSubscriptions}
        initialPaidCalendarDays={initialPaidCalendarDays}
        familySharingBootstrap={familySharingBootstrap}
        freeTierGate={freeTierGate}
        categoryOptions={categoryOptions}
        monthlyBudget={monthlyBudget}
      />
    </>
  );
}

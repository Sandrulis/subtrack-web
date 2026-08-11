import type { Metadata } from "next";
import { FsI18nBootstrap } from "@/components/fs/fs-i18n-bootstrap";
import { FsDashboardBootstrapTemplates } from "@/components/fs/fs-dashboard-bootstrap-templates";
import { DashboardFsView } from "@/components/fs/dashboard-fs-view";
import { loadNavBrandSnapshot } from "@/lib/brand/nav-brand-snapshot";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { getSessionDisplayPreferencesRow } from "@/lib/auth/display-preferences-server";
import { fetchDashboardSubscriptionsWithFamilyShare } from "@/lib/family-sharing/family-sharing-server";
import { fetchEnabledSubscriptionCategoryOptions } from "@/lib/subscriptions/subscription-categories-server";
import { fetchPaidCalendarDaysForSession } from "@/lib/subscriptions/fetch-paid-calendar-server";
import {
  buildDashboardFreeTierGatePayload,
  fetchSystemPaidPlanLiveForDashboard,
} from "@/lib/subscriptions/dashboard-free-tier-gate";
import {
  buildSsrDueCountByDay,
  buildSsrPaidDaySet,
} from "@/lib/dashboard/ssr-calendar-due-markers";
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
  const [userDisplay, subsBundle, initialPaidCalendarDays, paidPlanLive, dbPreferencesRaw, brand] =
    await Promise.all([
      getSessionUserDisplay(),
      fetchDashboardSubscriptionsWithFamilyShare(),
      fetchPaidCalendarDaysForSession(),
      fetchSystemPaidPlanLiveForDashboard(),
      getSessionDisplayPreferencesRow(),
      loadNavBrandSnapshot(),
    ]);

  const initialSubscriptions = subsBundle.subscriptions;
  const familySharingBootstrap = subsBundle.familyBootstrap;
  const freeTierGate = buildDashboardFreeTierGatePayload(userDisplay, paidPlanLive);
  const monthlyBudget = readMonthlyBudgetFromPreferences(
    sanitizeDisplayPreferencesPartial(dbPreferencesRaw),
  );

  const [categoryOptions, localeBundle, fsI18n] = await Promise.all([
    fetchEnabledSubscriptionCategoryOptions(
      initialSubscriptions.map((s) => s.category),
    ),
    resolveRequestUiLocales(),
    getUiPhrasesForRequest(fsDashboardPhraseKeys()),
  ]);
  const intlLocale = uiLocaleCodeToBcp47ForIntl(localeBundle.locale);

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dueCountByDay = buildSsrDueCountByDay(initialSubscriptions, y, m);
  const paidDaySet = buildSsrPaidDaySet(initialPaidCalendarDays, y, m);
  const paidDays = Array.from(paidDaySet).sort((a, b) => a - b);

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
        brand={brand}
        userDisplay={userDisplay}
        hasSubscriptions={initialSubscriptions.length > 0}
        hasMonthlyBudget={monthlyBudget != null}
        freeTierGate={freeTierGate}
        categoryOptions={categoryOptions}
        dueCountByDay={dueCountByDay}
        paidDays={paidDays}
      />
    </>
  );
}

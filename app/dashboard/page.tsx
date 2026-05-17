import type { Metadata } from "next";
import { FsI18nBootstrap } from "@/components/fs/fs-i18n-bootstrap";
import { DashboardFsView } from "@/components/fs/dashboard-fs-view";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { fetchSubscriptionsForSession } from "@/lib/subscriptions/fetch-subscriptions-server";
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
  const userDisplay = await getSessionUserDisplay();
  const initialSubscriptions = await fetchSubscriptionsForSession();
  const { locale } = await resolveRequestUiLocales();
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
  const fsI18n = await getUiPhrasesForRequest(fsDashboardPhraseKeys());

  return (
    <>
      <FsI18nBootstrap phrases={fsI18n} intlLocale={intlLocale} />
      <DashboardFsView
        userDisplay={userDisplay}
        initialSubscriptions={initialSubscriptions}
      />
    </>
  );
}

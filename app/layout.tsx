import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HtmlLangBridge } from "@/components/html-lang-bridge";
import { CookieConsentRoot } from "@/components/legal/cookie-consent-root";
import { SubtrackIntlProvider } from "@/components/subtrack-intl-provider";
import { getLanguagesCatalog } from "@/lib/languages-catalog";
import { localeCodeToHtmlLang } from "@/lib/html-lang";
import { getPublicSiteTranslationsMerged } from "@/lib/site-translations-public";
import { getPublicSystemSettings } from "@/lib/system-settings-public";
import { getPublicSiteOrigin } from "@/lib/site-url";
import { resolveRequestUiLocales } from "@/lib/ui/server-ui-phrases";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const { systemName } = await getPublicSystemSettings();
  return {
    metadataBase: getPublicSiteOrigin(),
    title: {
      default: systemName,
      template: `%s | ${systemName}`,
    },
    description:
      "Pārvaldi abonementus, rēķinus un citus periodiskos maksājumus vienuviet.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = await getLanguagesCatalog();
  const { locale: uiLocaleCode, isAuthenticated } = await resolveRequestUiLocales();
  const lang = localeCodeToHtmlLang(uiLocaleCode);
  const [dbMap, publicSettings] = await Promise.all([
    getPublicSiteTranslationsMerged(uiLocaleCode, catalog.defaultCode),
    getPublicSystemSettings(),
  ]);
  const systemSiteName = publicSettings.systemName;

  return (
    <html
      lang={lang}
      className={inter.variable}
      data-scroll-behavior="smooth"
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={inter.className}>
        <HtmlLangBridge
          serverUiLocaleCode={uiLocaleCode}
          preferLocalStorageLocale={!isAuthenticated}
        />
        <SubtrackIntlProvider
          locale={uiLocaleCode}
          systemSiteName={systemSiteName}
          paidPlan={publicSettings.paidPlan}
          languageOptions={catalog.options}
          dbMap={dbMap}
        >
          {children}
          <CookieConsentRoot />
        </SubtrackIntlProvider>
      </body>
    </html>
  );
}

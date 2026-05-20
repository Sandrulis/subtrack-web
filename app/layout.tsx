import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HtmlLangBridge } from "@/components/html-lang-bridge";
import { CookieConsentRoot } from "@/components/legal/cookie-consent-root";
import { PwaInstallHost } from "@/components/pwa/pwa-install-host";
import { PwaSwRegister } from "@/components/pwa/pwa-sw-register";
import { ModalBackdropCloseConfirmHost } from "@/components/ui/modal-backdrop-close-confirm-host";
import { SubtrackIntlProvider } from "@/components/subtrack-intl-provider";
import { PWA_DEFAULT_THEME_COLOR } from "@/lib/pwa/defaults";
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

export async function generateViewport(): Promise<Viewport> {
  const { pwa } = await getPublicSystemSettings();
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: pwa.enabled ? pwa.themeColor : PWA_DEFAULT_THEME_COLOR,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { systemName, brandLogo, pwa } = await getPublicSystemSettings();
  const icons = brandLogo
    ? {
        icon: [
          { url: brandLogo.icon32, sizes: "32x32", type: "image/png" },
          { url: brandLogo.icon192, sizes: "192x192", type: "image/png" },
        ],
        apple: [{ url: brandLogo.apple180, sizes: "180x180", type: "image/png" }],
      }
    : undefined;

  return {
    metadataBase: getPublicSiteOrigin(),
    title: {
      default: systemName,
      template: `%s | ${systemName}`,
    },
    description:
      "Pārvaldi abonementus, rēķinus un citus periodiskos maksājumus vienuviet.",
    icons,
    appleWebApp: pwa.enabled
      ? {
          capable: true,
          title: systemName,
          statusBarStyle: "default",
        }
      : undefined,
    applicationName: systemName,
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
  const brandLogo = publicSettings.brandLogo;

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
          brandLogo={brandLogo}
          paidPlan={publicSettings.paidPlan}
          pwa={publicSettings.pwa}
          languageOptions={catalog.options}
          dbMap={dbMap}
        >
          <PwaSwRegister pwa={publicSettings.pwa} />
          {children}
          <PwaInstallHost />
          <ModalBackdropCloseConfirmHost />
          <CookieConsentRoot />
        </SubtrackIntlProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { HtmlLangBridge } from "@/components/html-lang-bridge";
import { NavBrandBridge } from "@/components/brand/nav-brand-bridge";
import { CookieConsentRoot } from "@/components/legal/cookie-consent-root";
import { PwaInstallHost } from "@/components/pwa/pwa-install-host";
import { PwaSwRegister } from "@/components/pwa/pwa-sw-register";
import { FontAwesomeDeferredHead } from "@/components/font-awesome-deferred-head";
import { FONT_AWESOME_DEFERRED_INJECT } from "@/lib/icons/font-awesome-deferred-inject";
import { UmamiAnalytics } from "@/components/analytics/umami-analytics";
import { ModalBackdropCloseConfirmHost } from "@/components/ui/modal-backdrop-close-confirm-host";
import { SubtrackIntlProvider } from "@/components/subtrack-intl-provider";
import { PWA_DEFAULT_THEME_COLOR } from "@/lib/pwa/defaults";
import { getLanguagesCatalog } from "@/lib/languages-catalog";
import { localeCodeToHtmlLang } from "@/lib/html-lang";
import { getPublicSiteTranslationsMerged } from "@/lib/site-translations-public";
import { getPublicSystemSettings } from "@/lib/system-settings-public";
import { getPublicSiteOrigin } from "@/lib/site-url";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
import { resolveRequestUiLocales } from "@/lib/ui/server-ui-phrases";
import {
  buildSiteShareOpenGraphTwitterEn,
  buildSiteSharePageTitle,
  getSiteShareDescriptionEn,
} from "@/lib/seo/site-share-metadata";

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
    themeColor: pwa.enabled ? pwa.themeColor : PWA_DEFAULT_THEME_COLOR,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { systemName, brandLogo, pwa } = await getPublicSystemSettings();
  const title = buildSiteSharePageTitle(systemName);
  const description = getSiteShareDescriptionEn(systemName);
  const share = buildSiteShareOpenGraphTwitterEn({
    brand: systemName,
    title,
    description,
  });
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
    description,
    ...share,
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
  const [dbMap, publicSettings, familySharingEnabled] = await Promise.all([
    getPublicSiteTranslationsMerged(uiLocaleCode, catalog.defaultCode),
    getPublicSystemSettings(),
    isAuthenticated ? isIntegrationEnabled("family_sharing") : Promise.resolve(false),
  ]);
  const systemSiteName = publicSettings.systemName;
  const brandLogo = publicSettings.brandLogo;
  const pathname = (await headers()).get("x-pathname") ?? "";
  const bodyClassName =
    pathname === "/" ? `${inter.className} landing-page` : inter.className;

  return (
    <html
      lang={lang}
      className={inter.variable}
      data-scroll-behavior="smooth"
    >
      <head>
        <FontAwesomeDeferredHead />
        <Script id="subtrack-fa-defer" strategy="afterInteractive">
          {FONT_AWESOME_DEFERRED_INJECT}
        </Script>
      </head>
      <body className={bodyClassName}>
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
          integrations={{ familySharingEnabled }}
          languageOptions={catalog.options}
          dbMap={dbMap}
        >
          <NavBrandBridge
            label={systemSiteName}
            logoTopbar={brandLogo?.topbar ?? null}
          >
            <PwaSwRegister pwa={publicSettings.pwa} />
            <UmamiAnalytics />
            {children}
            <PwaInstallHost />
            <ModalBackdropCloseConfirmHost />
            <CookieConsentRoot />
          </NavBrandBridge>
        </SubtrackIntlProvider>
      </body>
    </html>
  );
}

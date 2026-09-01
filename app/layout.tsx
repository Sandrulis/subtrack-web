import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { HtmlLangBridge } from "@/components/html-lang-bridge";
import { NavBrandBridge } from "@/components/brand/nav-brand-bridge";
import { CookieConsentRoot } from "@/components/legal/cookie-consent-root";
import { PwaDeferredInstallProvider } from "@/components/pwa/pwa-deferred-install-provider";
import { PwaInstallHost } from "@/components/pwa/pwa-install-host";
import { CapacitorNativeAppLoading } from "@/components/capacitor/capacitor-native-app-loading";
import { CapacitorNativeAuthPersist } from "@/components/capacitor/capacitor-native-auth-persist";
import { CapacitorNativeShellBootstrap } from "@/components/capacitor/capacitor-native-shell-bootstrap";
import { NativeShellBootLayer } from "@/components/capacitor/native-shell-boot-layer";
import { NativeShellCriticalStyles } from "@/components/capacitor/native-shell-critical-styles";
import { NativeShellPaintGuard } from "@/components/capacitor/native-shell-paint-guard";
import { isNativeShellRequestHeader } from "@/lib/capacitor/native-shell-request";
import { PwaSwRegister } from "@/components/pwa/pwa-sw-register";
import { FontAwesomeDeferredHead } from "@/components/font-awesome-deferred-head";
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
import { hasPublishedBlogPosts } from "@/lib/blog/blog-public";
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
  const icons =
    brandLogo && brandLogo.revision > 0
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
  const [dbMap, publicSettings, familySharingEnabled, blogPostsPublished] = await Promise.all([
    getPublicSiteTranslationsMerged(uiLocaleCode, catalog.defaultCode),
    getPublicSystemSettings(),
    isAuthenticated ? isIntegrationEnabled("family_sharing") : Promise.resolve(false),
    hasPublishedBlogPosts(),
  ]);
  const systemSiteName = publicSettings.systemName;
  const brandLogo = publicSettings.brandLogo;
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const nativeShellSsr = isNativeShellRequestHeader(
    requestHeaders.get("x-native-shell"),
  );
  const bodyClassName =
    pathname === "/" ? `${inter.className} landing-page` : inter.className;
  const nativeBootLoadingText =
    dbMap["app.page_loading"]?.trim() || "Loading…";
  const htmlClassName = [
    inter.variable,
    nativeShellSsr ? "native-shell-pending" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html
      lang={lang}
      className={htmlClassName}
      data-scroll-behavior="smooth"
      style={nativeShellSsr ? { backgroundColor: "#050510" } : undefined}
    >
      <head>
        {nativeShellSsr ? <NativeShellCriticalStyles /> : null}
        <NativeShellPaintGuard />
        <FontAwesomeDeferredHead />
      </head>
      <body className={bodyClassName}>
        <NativeShellBootLayer
          loadingText={nativeBootLoadingText}
          activeOnLoad={nativeShellSsr}
        />
        <div className="native-shell-app-root">
        <HtmlLangBridge
          serverUiLocaleCode={uiLocaleCode}
          preferLocalStorageLocale={!isAuthenticated}
        />
        <SubtrackIntlProvider
          locale={uiLocaleCode}
          hasPublishedBlogPosts={blogPostsPublished}
          systemSiteName={systemSiteName}
          brandLogo={brandLogo}
          paidPlan={publicSettings.paidPlan}
          signupEnabled={publicSettings.signupEnabled}
          pwa={publicSettings.pwa}
          integrations={{ familySharingEnabled }}
          languageOptions={catalog.options}
          dbMap={dbMap}
        >
          <PwaDeferredInstallProvider>
            <NavBrandBridge
              label={systemSiteName}
              logoTopbar={brandLogo?.topbar ?? null}
            >
              <CapacitorNativeShellBootstrap />
              <CapacitorNativeAuthPersist />
              <CapacitorNativeAppLoading />
              <PwaSwRegister pwa={publicSettings.pwa} />
              <UmamiAnalytics />
              {children}
              <PwaInstallHost />
            <ModalBackdropCloseConfirmHost />
            <CookieConsentRoot />
            </NavBrandBridge>
          </PwaDeferredInstallProvider>
        </SubtrackIntlProvider>
        </div>
      </body>
    </html>
  );
}

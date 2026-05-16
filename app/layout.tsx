import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { HtmlLangBridge } from "@/components/html-lang-bridge";
import { SubtrackIntlProvider } from "@/components/subtrack-intl-provider";
import { getLanguagesCatalog } from "@/lib/languages-catalog";
import {
  resolveRootHtmlLang,
  SUBTRACK_UI_LOCALE_COOKIE,
} from "@/lib/html-lang";
import { getPublicSiteTranslationsMerged } from "@/lib/site-translations-public";
import { getSystemSiteName } from "@/lib/system-settings-public";
import { resolveUiLocaleCodeFromRequest } from "@/lib/ui/ui-locale-from-request";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const systemName = await getSystemSiteName();
  return {
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
  const h = await headers();
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(SUBTRACK_UI_LOCALE_COOKIE)?.value ?? null;
  const catalog = await getLanguagesCatalog();
  const acceptLanguage = h.get("accept-language");
  const lang = resolveRootHtmlLang(cookieLocale, acceptLanguage, catalog);
  const uiLocaleCode = resolveUiLocaleCodeFromRequest(
    cookieLocale,
    acceptLanguage,
    catalog,
  );
  const [dbMap, systemSiteName] = await Promise.all([
    getPublicSiteTranslationsMerged(uiLocaleCode, catalog.defaultCode),
    getSystemSiteName(),
  ]);

  return (
    <html lang={lang} className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={inter.className}>
        <HtmlLangBridge defaultInterfaceLanguageCode={catalog.defaultCode} />
        <SubtrackIntlProvider locale={uiLocaleCode} systemSiteName={systemSiteName} dbMap={dbMap}>
          {children}
        </SubtrackIntlProvider>
      </body>
    </html>
  );
}

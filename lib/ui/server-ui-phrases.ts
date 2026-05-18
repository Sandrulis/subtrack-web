import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getSessionInterfaceLanguageCode } from "@/lib/auth/display-preferences-server";
import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";
import { SUBTRACK_UI_LOCALE_COOKIE } from "@/lib/html-lang";
import { getLanguagesCatalog } from "@/lib/languages-catalog";
import { getPublicSiteTranslationsMerged } from "@/lib/site-translations-public";
import { resolveUiLocaleCodeForRequest } from "@/lib/ui/ui-locale-from-request";

export const resolveRequestUiLocales = cache(async (): Promise<{
  locale: string;
  defaultLocale: string;
  isAuthenticated: boolean;
}> => {
  const cookieStore = await cookies();
  const h = await headers();
  const catalog = await getLanguagesCatalog();
  const { user } = await loadAuthContext();
  const isAuthenticated = !!user;
  const sessionInterfaceLanguageCode = isAuthenticated
    ? await getSessionInterfaceLanguageCode()
    : null;
  const locale = resolveUiLocaleCodeForRequest({
    isAuthenticated,
    sessionInterfaceLanguageCode,
    cookieVal: cookieStore.get(SUBTRACK_UI_LOCALE_COOKIE)?.value ?? null,
    acceptLanguage: h.get("accept-language"),
    catalog,
  });
  return {
    locale,
    defaultLocale: catalog.defaultCode.trim().toLowerCase(),
    isAuthenticated,
  };
});

/** Viens sapludināts tulkošanu objekts uz dokumenta pieprasījumu (layout + metadata + lapa). */
const getMergedSiteTranslationsForRequest = cache(
  async (): Promise<Record<string, string>> => {
    const { locale, defaultLocale } = await resolveRequestUiLocales();
    return getPublicSiteTranslationsMerged(locale, defaultLocale);
  },
);

export async function getUiPhraseForRequest(key: string): Promise<string> {
  const map = await getMergedSiteTranslationsForRequest();
  const v = map[key];
  if (typeof v === "string" && v.length > 0) return v;
  const { locale } = await resolveRequestUiLocales();
  const fb = pickFallbackPhrase(key, locale);
  if (typeof fb === "string" && fb.length > 0) return fb;
  return key;
}

/** Vairākām atslēgām vienā merged pieprasījumā (demo /fs/*.js u.c.). */
export async function getUiPhrasesForRequest(
  keys: readonly string[],
): Promise<Record<string, string>> {
  const map = await getMergedSiteTranslationsForRequest();
  const { locale } = await resolveRequestUiLocales();
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = map[key];
    if (typeof v === "string" && v.length > 0) {
      out[key] = v;
      continue;
    }
    const fb = pickFallbackPhrase(key, locale);
    out[key] = typeof fb === "string" && fb.length > 0 ? fb : key;
  }
  return out;
}

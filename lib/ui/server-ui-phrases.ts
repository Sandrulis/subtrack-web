import { cookies, headers } from "next/headers";
import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";
import { SUBTRACK_UI_LOCALE_COOKIE } from "@/lib/html-lang";
import { getLanguagesCatalog } from "@/lib/languages-catalog";
import { getPublicSiteTranslationsMerged } from "@/lib/site-translations-public";
import { resolveUiLocaleCodeFromRequest } from "@/lib/ui/ui-locale-from-request";

export async function resolveRequestUiLocales(): Promise<{
  locale: string;
  defaultLocale: string;
}> {
  const cookieStore = await cookies();
  const h = await headers();
  const catalog = await getLanguagesCatalog();
  const locale = resolveUiLocaleCodeFromRequest(
    cookieStore.get(SUBTRACK_UI_LOCALE_COOKIE)?.value ?? null,
    h.get("accept-language"),
    catalog,
  );
  return {
    locale,
    defaultLocale: catalog.defaultCode.trim().toLowerCase(),
  };
}

export async function getUiPhraseForRequest(key: string): Promise<string> {
  const { locale, defaultLocale } = await resolveRequestUiLocales();
  const map = await getPublicSiteTranslationsMerged(locale, defaultLocale);
  const v = map[key];
  if (typeof v === "string" && v.length > 0) return v;
  const fb = pickFallbackPhrase(key, locale);
  if (typeof fb === "string" && fb.length > 0) return fb;
  return key;
}

/** Vairākām atslēgām vienā merged pieprasījumā (demo /fs/*.js u.c.). */
export async function getUiPhrasesForRequest(
  keys: readonly string[],
): Promise<Record<string, string>> {
  const { locale, defaultLocale } = await resolveRequestUiLocales();
  const map = await getPublicSiteTranslationsMerged(locale, defaultLocale);
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

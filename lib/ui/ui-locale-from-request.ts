import { pickUiLocaleFromCountryForCatalog } from "@/lib/geo/country-code-to-ui-locale";
import type { LanguagesCatalog } from "@/lib/languages-catalog";
import {
  isValidPreferredLanguageCode,
  pickUiLanguageFromAcceptHeader,
} from "@/lib/html-lang";

function pickValidCatalogLocaleCode(
  code: string | null | undefined,
  catalog: LanguagesCatalog,
): string | null {
  if (!code || !isValidPreferredLanguageCode(code)) return null;
  const norm = code.trim().toLowerCase();
  if (catalog.codes.length === 0 || catalog.codes.includes(norm)) {
    return norm;
  }
  return null;
}

function resolveGeoLocale(
  countryCode: string | null | undefined,
  catalog: LanguagesCatalog,
): string | null {
  return pickUiLocaleFromCountryForCatalog(countryCode, catalog);
}

/**
 * `languages.code` vērtība no sīkdatiem, ģeovalsts, Accept-Language + kataloga noklusējums (viesis).
 */
export function resolveUiLocaleCodeFromRequest(
  cookieVal: string | null | undefined,
  acceptLanguage: string | null,
  catalog: LanguagesCatalog,
  countryCode?: string | null,
): string {
  const fromCookie = pickValidCatalogLocaleCode(cookieVal, catalog);
  if (fromCookie) return fromCookie;

  const fromGeo = resolveGeoLocale(countryCode, catalog);
  if (fromGeo) return fromGeo;

  return pickUiLanguageFromAcceptHeader(
    acceptLanguage,
    catalog.codes,
    catalog.defaultCode,
  );
}

/**
 * UI lokāle uz pieprasījumu:
 * - ielogots, manuāla valoda (`interface_language_user_set`): profils → ģeo → Accept-Language → noklusējums;
 * - ielogots, bez manuālas izvēles: ģeo → profils → Accept-Language → noklusējums;
 * - viesis: sīkdatne → ģeo → Accept-Language → noklusējums.
 */
export function resolveUiLocaleCodeForRequest(opts: {
  isAuthenticated: boolean;
  sessionInterfaceLanguageCode?: string | null;
  sessionInterfaceLanguageUserSet?: boolean;
  cookieVal?: string | null;
  acceptLanguage?: string | null;
  countryCode?: string | null;
  catalog: LanguagesCatalog;
}): string {
  const {
    isAuthenticated,
    sessionInterfaceLanguageCode,
    sessionInterfaceLanguageUserSet = false,
    cookieVal = null,
    acceptLanguage = null,
    countryCode = null,
    catalog,
  } = opts;

  const fromGeo = resolveGeoLocale(countryCode, catalog);
  const fromSession = pickValidCatalogLocaleCode(sessionInterfaceLanguageCode, catalog);
  const fallback = () =>
    pickUiLanguageFromAcceptHeader(
      acceptLanguage,
      catalog.codes,
      catalog.defaultCode,
    );

  if (!isAuthenticated) {
    return resolveUiLocaleCodeFromRequest(
      cookieVal,
      acceptLanguage,
      catalog,
      countryCode,
    );
  }

  if (sessionInterfaceLanguageUserSet && fromSession) {
    return fromSession;
  }

  if (fromGeo) return fromGeo;
  if (fromSession) return fromSession;
  return fallback();
}

/** `Intl`-draudzīgs BCP 47 aploksnei (vienkāršots). */
export function uiLocaleCodeToBcp47ForIntl(code: string): string {
  const c = code.trim().toLowerCase();
  if (c.startsWith("pt")) return "pt-BR";
  if (c === "ru") return "ru-RU";
  return c.split("-")[0] || "lv";
}

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

/**
 * `languages.code` vērtība no sīkdatiem vai Accept-Language + kataloga noklusējums (viesis).
 */
export function resolveUiLocaleCodeFromRequest(
  cookieVal: string | null | undefined,
  acceptLanguage: string | null,
  catalog: LanguagesCatalog,
): string {
  const fromCookie = pickValidCatalogLocaleCode(cookieVal, catalog);
  if (fromCookie) return fromCookie;
  return pickUiLanguageFromAcceptHeader(
    acceptLanguage,
    catalog.codes,
    catalog.defaultCode,
  );
}

/**
 * UI lokāle uz pieprasījumu:
 * - ielogots: profila `interface_language_code` → Accept-Language (sīkdatne netiek lietota);
 * - viesis: sīkdatne → Accept-Language.
 */
export function resolveUiLocaleCodeForRequest(opts: {
  isAuthenticated: boolean;
  sessionInterfaceLanguageCode?: string | null;
  cookieVal?: string | null;
  acceptLanguage?: string | null;
  catalog: LanguagesCatalog;
}): string {
  const {
    isAuthenticated,
    sessionInterfaceLanguageCode,
    cookieVal = null,
    acceptLanguage = null,
    catalog,
  } = opts;

  if (isAuthenticated) {
    const fromSession = pickValidCatalogLocaleCode(sessionInterfaceLanguageCode, catalog);
    if (fromSession) return fromSession;
    return pickUiLanguageFromAcceptHeader(
      acceptLanguage,
      catalog.codes,
      catalog.defaultCode,
    );
  }

  return resolveUiLocaleCodeFromRequest(cookieVal, acceptLanguage, catalog);
}

/** `Intl`-draudzīgs BCP 47 aploksnei (vienkāršots). */
export function uiLocaleCodeToBcp47ForIntl(code: string): string {
  const c = code.trim().toLowerCase();
  if (c.startsWith("pt")) return "pt-BR";
  if (c === "ru") return "ru-RU";
  return c.split("-")[0] || "lv";
}

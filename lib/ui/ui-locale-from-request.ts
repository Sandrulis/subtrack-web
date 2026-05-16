import type { LanguagesCatalog } from "@/lib/languages-catalog";
import {
  isValidPreferredLanguageCode,
  pickUiLanguageFromAcceptHeader,
} from "@/lib/html-lang";

/**
 * `languages.code` vērtība no sīkdatiem vai Accept-Language + kataloga noklusējums.
 */
export function resolveUiLocaleCodeFromRequest(
  cookieVal: string | null | undefined,
  acceptLanguage: string | null,
  catalog: LanguagesCatalog,
): string {
  if (cookieVal && isValidPreferredLanguageCode(cookieVal)) {
    const norm = cookieVal.trim().toLowerCase();
    if (catalog.codes.length === 0 || catalog.codes.includes(norm)) {
      return norm;
    }
  }
  return pickUiLanguageFromAcceptHeader(
    acceptLanguage,
    catalog.codes,
    catalog.defaultCode,
  );
}

/** `Intl`-draudzīgs BCP 47 aploksnei (vienkāršots). */
export function uiLocaleCodeToBcp47ForIntl(code: string): string {
  const c = code.trim().toLowerCase();
  if (c.startsWith("pt")) return "pt-BR";
  if (c === "ru") return "ru-RU";
  return c.split("-")[0] || "lv";
}

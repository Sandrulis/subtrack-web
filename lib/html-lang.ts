const SUPPORTED = ["lv", "en", "ru"] as const;

export type HtmlLang = (typeof SUPPORTED)[number];

/** Saskaņots ar admin `languages.code`: mazie burtnīki, opcionāli `-` segments. */
const PREFERRED_LANGUAGE_CODE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** HTTP sīkdati: lietotāja izvēlētā UI valodas `languages.code`. */
export const SUBTRACK_UI_LOCALE_COOKIE = "subtrack_ui_locale";

export function isValidPreferredLanguageCode(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const s = raw.trim().toLowerCase();
  if (s.length < 2 || s.length > 24) return false;
  return PREFERRED_LANGUAGE_CODE_RE.test(s);
}

function normalizeUiLangCode(s: string): string {
  return s.trim().toLowerCase().replace(/_/g, "-");
}

/** Kartē `languages.code` uz `<html lang>` (piem., pt-br -> pt-BR). */
export function localeCodeToHtmlLang(code: string): string {
  const c = code.trim().toLowerCase();
  const segs = c.split("-").filter(Boolean);
  if (segs.length === 0) return "lv";
  if (segs.length === 1) return segs[0]!;
  return `${segs[0]}-${segs[1]!.toUpperCase()}`;
}

/**
 * Bez sīkdatnes: Accept-Language pret katalogu, citādi `fallbackCode` no DB (`is_default`).
 */
export function pickUiLanguageFromAcceptHeader(
  acceptLanguage: string | null,
  catalogCodes: readonly string[],
  fallbackCode: string,
): string {
  const cat = [...new Set(catalogCodes.map((c) => normalizeUiLangCode(c)))].filter(Boolean);
  const fbRaw = normalizeUiLangCode(fallbackCode);
  const fallback = cat.includes(fbRaw) ? fbRaw : (cat[0] ?? "lv");

  if (!acceptLanguage || cat.length === 0) return fallback;

  const parts = acceptLanguage
    .split(",")
    .map((p) => p.split(";")[0]!.trim())
    .filter(Boolean);

  for (const p of parts) {
    const norm = normalizeUiLangCode(p);
    if (cat.includes(norm)) return norm;
    const primary = norm.split("-")[0]!;
    if (cat.includes(primary)) return primary;
    const byPrimary = cat.find((c) => c.split("-")[0] === primary);
    if (byPrimary) return byPrimary;
  }
  return fallback;
}

/**
 * SSR: sīkdati → katalogs; citādi Accept-Language + sistēmas noklusējums no DB.
 */
export function resolveRootHtmlLang(
  cookieVal: string | undefined | null,
  acceptLanguage: string | null,
  catalog: { codes: readonly string[]; defaultCode: string },
): string {
  if (cookieVal && isValidPreferredLanguageCode(cookieVal)) {
    const norm = cookieVal.trim().toLowerCase();
    if (catalog.codes.length === 0 || catalog.codes.includes(norm)) {
      return localeCodeToHtmlLang(norm);
    }
  }
  const picked = pickUiLanguageFromAcceptHeader(
    acceptLanguage,
    catalog.codes,
    catalog.defaultCode,
  );
  return localeCodeToHtmlLang(picked);
}

/** @deprecated Izmanto `pickUiLanguageFromAcceptHeader` ar katalogu no DB. */
export function pickHtmlLang(acceptLanguage: string | null): HtmlLang {
  if (!acceptLanguage) return "lv";

  const codes = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]!.trim().toLowerCase())
    .map((code) => code.split("-")[0]!);

  for (const code of codes) {
    if ((SUPPORTED as readonly string[]).includes(code)) {
      return code as HtmlLang;
    }
  }
  return "lv";
}

/**
 * Pēc prefs saglabāšanas / lokālā keša hidracijas (`/settings`).
 * Darbojas tikai pārlūkā.
 */
export function applyUiLocaleInBrowser(code: string): void {
  if (typeof document === "undefined") return;
  if (!isValidPreferredLanguageCode(code)) return;
  const norm = code.trim().toLowerCase();
  document.documentElement.lang = localeCodeToHtmlLang(norm);
  document.cookie = `${SUBTRACK_UI_LOCALE_COOKIE}=${encodeURIComponent(norm)};path=/;max-age=31536000;samesite=lax`;
}

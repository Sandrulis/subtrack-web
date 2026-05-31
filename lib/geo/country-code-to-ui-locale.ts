import { normalizeCountryCode } from "@/lib/billing/country-to-billing-currency";
import type { LanguagesCatalog } from "@/lib/languages-catalog";

/**
 * Valsts → primārā UI valoda (`languages.code`).
 * Ja valsts nav kartēta vai valoda nav katalogā, atgriež `null` (lieto `catalog.defaultCode`).
 */
const COUNTRY_TO_UI_LOCALE: Record<string, string> = {
  AD: "es",
  AR: "es",
  AT: "de",
  AU: "en",
  BE: "fr",
  BG: "en",
  BO: "es",
  BR: "pt",
  BY: "ru",
  CA: "en",
  CH: "de",
  CL: "es",
  CO: "es",
  CR: "es",
  CU: "es",
  CY: "en",
  CZ: "en",
  DE: "de",
  DK: "en",
  DO: "es",
  EC: "es",
  EE: "en",
  ES: "es",
  FI: "en",
  FR: "fr",
  GB: "en",
  UK: "en",
  GR: "en",
  GT: "es",
  HN: "es",
  HR: "en",
  HU: "en",
  IE: "en",
  IL: "en",
  IN: "en",
  IS: "en",
  IT: "en",
  JP: "en",
  KR: "en",
  KZ: "ru",
  LI: "de",
  LT: "en",
  LU: "fr",
  LV: "lv",
  MC: "fr",
  MD: "ru",
  MT: "en",
  MX: "es",
  MY: "en",
  NI: "es",
  NL: "en",
  NO: "en",
  NZ: "en",
  PA: "es",
  PE: "es",
  PH: "en",
  PL: "en",
  PR: "es",
  PT: "pt",
  PY: "es",
  RO: "en",
  RS: "en",
  RU: "ru",
  SE: "en",
  SG: "en",
  SI: "en",
  SK: "en",
  SV: "es",
  TH: "en",
  TR: "en",
  UA: "ru",
  US: "en",
  UY: "es",
  VE: "es",
  VN: "en",
  ZA: "en",
};

/** ISO valsts → `languages.code`, ja kods ir aktīvajā katalogā. */
export function pickUiLocaleFromCountryForCatalog(
  countryCode: string | null | undefined,
  catalog: LanguagesCatalog,
): string | null {
  const country = normalizeCountryCode(countryCode);
  if (!country) return null;
  const mapped = COUNTRY_TO_UI_LOCALE[country];
  if (!mapped) return null;
  const norm = mapped.trim().toLowerCase();
  if (catalog.codes.length === 0 || catalog.codes.includes(norm)) {
    return norm;
  }
  return null;
}

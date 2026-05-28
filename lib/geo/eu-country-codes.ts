/** ES dalībvalstis (ISO 3166-1 alpha-2) – Stripe / norēķinu reģions EUR. */
export const EU_COUNTRY_CODES = new Set<string>([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

export function isEuCountryCode(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return EU_COUNTRY_CODES.has(countryCode.trim().toUpperCase());
}

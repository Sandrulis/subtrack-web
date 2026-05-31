import {
  countryCodeToBillingCurrency,
  normalizeCountryCode,
} from "@/lib/billing/country-to-billing-currency";
import type { BillingCurrency } from "@/lib/billing/billing-currency";
import { pickUiLocaleFromCountryForCatalog } from "@/lib/geo/country-code-to-ui-locale";
import { resolveRequestCountryCode } from "@/lib/geo/resolve-request-country";
import { getLanguagesCatalog } from "@/lib/languages-catalog";

export type RegistrationGeoPayload = {
  registration_country: string | null;
  billing_currency: BillingCurrency;
  interface_language_code: string | null;
};

/** Reģistrācijas metadata: valsts, norēķinu valūta, saskarnes valoda (ja katalogā). */
export async function buildRegistrationGeoPayload(): Promise<RegistrationGeoPayload> {
  const country = normalizeCountryCode(await resolveRequestCountryCode());
  const catalog = await getLanguagesCatalog();
  const interface_language_code = pickUiLocaleFromCountryForCatalog(country, catalog);
  return {
    registration_country: country,
    billing_currency: countryCodeToBillingCurrency(country),
    interface_language_code,
  };
}

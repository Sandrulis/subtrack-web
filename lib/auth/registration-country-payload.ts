import {
  countryCodeToBillingCurrency,
  normalizeCountryCode,
} from "@/lib/billing/country-to-billing-currency";
import type { BillingCurrency } from "@/lib/billing/billing-currency";
import { resolveRequestCountryCode } from "@/lib/geo/resolve-request-country";

export type RegistrationGeoPayload = {
  registration_country: string | null;
  billing_currency: BillingCurrency;
};

/** Reģistrācijas metadata: valsts + norēķinu valūta (Stripe reģionam). */
export async function buildRegistrationGeoPayload(): Promise<RegistrationGeoPayload> {
  const country = normalizeCountryCode(await resolveRequestCountryCode());
  return {
    registration_country: country,
    billing_currency: countryCodeToBillingCurrency(country),
  };
}

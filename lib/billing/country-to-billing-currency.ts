import {
  type BillingCurrency,
  normalizeBillingCurrency,
} from "@/lib/billing/billing-currency";
import { isEuCountryCode } from "@/lib/geo/eu-country-codes";

export function normalizeCountryCode(
  code: string | null | undefined,
): string | null {
  if (typeof code !== "string") return null;
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return null;
  if (c === "XX" || c === "T1") return null;
  return c;
}

/** ES → EUR, GB/UK → GBP, citādi USD. */
export function countryCodeToBillingCurrency(
  countryCode: string | null | undefined,
): BillingCurrency {
  const c = normalizeCountryCode(countryCode);
  if (!c) return "USD";
  if (c === "GB" || c === "UK") return "GBP";
  if (isEuCountryCode(c)) return "EUR";
  return "USD";
}

export function billingCurrencyFromUserMetadata(
  meta: Record<string, unknown> | null | undefined,
): BillingCurrency {
  const fromMeta = meta?.billing_currency;
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    return normalizeBillingCurrency(fromMeta.trim().toUpperCase(), "USD");
  }
  const country =
    typeof meta?.registration_country === "string"
      ? meta.registration_country
      : null;
  return countryCodeToBillingCurrency(country);
}

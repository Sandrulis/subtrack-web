/** Norēķinu valūta pēc reģiona (Stripe: ES → EUR, UK → GBP, pārējie → USD). */
export type BillingCurrency = "EUR" | "GBP" | "USD";

export const BILLING_CURRENCIES: readonly BillingCurrency[] = [
  "EUR",
  "GBP",
  "USD",
];

export function isBillingCurrency(v: unknown): v is BillingCurrency {
  return v === "EUR" || v === "GBP" || v === "USD";
}

export function normalizeBillingCurrency(
  v: unknown,
  fallback: BillingCurrency = "USD",
): BillingCurrency {
  return isBillingCurrency(v) ? v : fallback;
}

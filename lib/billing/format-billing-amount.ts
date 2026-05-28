import type { BillingCurrency } from "@/lib/billing/billing-currency";

export function createBillingAmountFormatter(
  intlLocale: string,
  currency: BillingCurrency,
): (amount: number) => string {
  return (amount: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency,
    }).format(Number.isFinite(amount) ? amount : 0);
}

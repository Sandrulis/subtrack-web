import type { BillingCurrency } from "@/lib/billing/billing-currency";
import { countryCodeToBillingCurrency } from "@/lib/billing/country-to-billing-currency";
import { resolveRequestCountryCode } from "@/lib/geo/resolve-request-country";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeDisplayPreferencesPartial } from "@/lib/user-display-preferences";

/** Ielogotam lietotājam: reģistrācijas valsts → valūta; citādi prefs vai pieprasījuma valsts. */
export async function resolveSessionUserBillingCurrency(
  userId: string,
): Promise<BillingCurrency> {
  const supabase = await createServerSupabaseClient();
  const { data: row } = await supabase
    .from("users")
    .select("registration_country, display_preferences")
    .eq("id", userId)
    .maybeSingle();

  const country =
    typeof row?.registration_country === "string"
      ? row.registration_country
      : null;
  if (country) {
    return countryCodeToBillingCurrency(country);
  }

  const prefs = sanitizeDisplayPreferencesPartial(row?.display_preferences);
  if (
    prefs.currency === "EUR" ||
    prefs.currency === "GBP" ||
    prefs.currency === "USD"
  ) {
    return prefs.currency;
  }

  return countryCodeToBillingCurrency(await resolveRequestCountryCode());
}

/** Viesiem: valsts no CDN / IP → norēķinu valūta. */
export async function resolveGuestBillingCurrency(): Promise<BillingCurrency> {
  return countryCodeToBillingCurrency(await resolveRequestCountryCode());
}

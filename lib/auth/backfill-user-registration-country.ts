import {
  countryCodeToBillingCurrency,
  normalizeCountryCode,
} from "@/lib/billing/country-to-billing-currency";
import { resolveCountryFromHeaders } from "@/lib/geo/resolve-request-country";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import {
  mergeDisplayPreferences,
  sanitizeDisplayPreferencesPartial,
} from "@/lib/user-display-preferences";

/**
 * OAuth / vecie konti: ja `registration_country` vēl nav, iestata no pieprasījuma
 * (CDN valsts vai IP ģeolokācija) un atjauno `display_preferences.currency`.
 */
export async function backfillUserRegistrationCountry(
  userId: string,
  headerStore: Headers,
): Promise<void> {
  const country = normalizeCountryCode(
    await resolveCountryFromHeaders(headerStore),
  );
  if (!country) return;

  const svc = createServiceRoleSupabaseClient();
  if (!svc) return;

  const { data: row, error: readErr } = await svc
    .from("users")
    .select("registration_country, display_preferences")
    .eq("id", userId)
    .maybeSingle();

  if (readErr || !row) return;
  if (typeof row.registration_country === "string" && row.registration_country.trim()) {
    return;
  }

  const billingCurrency = countryCodeToBillingCurrency(country);
  const merged = mergeDisplayPreferences(
    sanitizeDisplayPreferencesPartial(row.display_preferences),
    { currency: billingCurrency },
  );

  const { error: updErr } = await svc
    .from("users")
    .update({
      registration_country: country,
      display_preferences: merged,
    })
    .eq("id", userId);

  if (updErr) {
    console.warn("[backfillUserRegistrationCountry]", updErr.message);
  }
}

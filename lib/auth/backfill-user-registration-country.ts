import {
  countryCodeToBillingCurrency,
  normalizeCountryCode,
} from "@/lib/billing/country-to-billing-currency";
import { pickUiLocaleFromCountryForCatalog } from "@/lib/geo/country-code-to-ui-locale";
import { resolveCountryFromHeaders } from "@/lib/geo/resolve-request-country";
import { getLanguagesCatalog } from "@/lib/languages-catalog";
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
  const partial = sanitizeDisplayPreferencesPartial(row.display_preferences);
  const catalog = await getLanguagesCatalog();
  const geoLocale = pickUiLocaleFromCountryForCatalog(country, catalog);
  const prefsPatch = {
    ...partial,
    currency: billingCurrency,
  };
  if (geoLocale && partial.interface_language_user_set !== true) {
    prefsPatch.interface_language_code = geoLocale;
  }
  const merged = mergeDisplayPreferences(prefsPatch);

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

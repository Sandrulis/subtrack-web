import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  resolvePublicBrandLogoAssets,
  type PublicBrandLogoAssets,
} from "@/lib/brand/logo-assets";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import {
  normalizePwaRow,
  type PublicPwaSettings,
} from "@/lib/pwa/public-pwa-settings";
import { parsePaidPlanPriceField } from "@/lib/paid-plan-annual";
import {
  normalizePaidPlanLifetimeRow,
  resolvePaidPlanLifetimePublic,
  type PaidPlanLifetimePublic,
} from "@/lib/paid-plan-lifetime";
import { createPublicAnonSupabaseClient } from "@/lib/supabase/public-anon-client";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
  sanitizeDisplayPreferencesPartial,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";

export type { PublicPwaSettings } from "@/lib/pwa/public-pwa-settings";

/** Publiska maksas plāna pitch (landing + API limits); `enabled` no `system_settings`. */
export type SubtrackPublicPaidPlan = {
  enabled: boolean;
  priceEur: number;
  freeSubscriptionLimit: number;
  /** Admin slēdzis „gada norēķins”. */
  annualBillingEnabled: boolean;
  /** Gada cena EUR no DB; publiski rāda, ja derīga un slēdzis ieslēgts. */
  annualPriceEur: number | null;
  /** Lifetime Pro opcija (laika / pirkumu limits). */
  lifetime: PaidPlanLifetimePublic;
};

export type { PaidPlanLifetimePublic } from "@/lib/paid-plan-lifetime";

export type { PublicBrandLogoAssets } from "@/lib/brand/logo-assets";

export type PublicSystemSettings = {
  systemName: string;
  /** Augšupielādēts logo; `null` = ģenerētais noklusējuma zīmols (`/icon`). */
  brandLogo: PublicBrandLogoAssets | null;
  /** Pilns `DisplayPreferences`: koda `DISPLAY_PREFERENCES_DEFAULTS` + `default_display_preferences` no DB */
  displayPreferenceDefaults: DisplayPreferences;
  paidPlan: SubtrackPublicPaidPlan;
  pwa: PublicPwaSettings;
};

const PAID_PLAN_DEFAULTS: SubtrackPublicPaidPlan = {
  enabled: false,
  priceEur: 1.99,
  freeSubscriptionLimit: 5,
  annualBillingEnabled: false,
  annualPriceEur: null,
  lifetime: {
    enabled: false,
    priceEur: null,
    endsAt: null,
    purchaseLimit: null,
    purchaseCount: 0,
    active: false,
    remainingMs: null,
    purchasesRemaining: null,
  },
};

export function coercePgBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

export function normalizePaidPlanRow(data: unknown): SubtrackPublicPaidPlan {
  if (!data || typeof data !== "object") return { ...PAID_PLAN_DEFAULTS };
  const r = data as Record<string, unknown>;
  const enabled = coercePgBool(r.paid_plan_enabled);
  const priceRaw = r.paid_plan_price_eur;
  const price =
    typeof priceRaw === "number"
      ? priceRaw
      : typeof priceRaw === "string"
        ? Number.parseFloat(priceRaw)
        : NaN;
  const limitRaw = r.paid_plan_free_subscription_limit;
  const limit =
    typeof limitRaw === "number"
      ? Math.trunc(limitRaw)
      : typeof limitRaw === "string"
        ? Number.parseInt(limitRaw, 10)
        : NaN;
  const annualBillingEnabled = enabled && coercePgBool(r.paid_plan_annual_enabled);
  const annualPriceEur = parsePaidPlanPriceField(r.paid_plan_annual_price_eur);
  const lifetimeConfig = normalizePaidPlanLifetimeRow({ ...r, paid_plan_enabled: enabled });
  const lifetime = resolvePaidPlanLifetimePublic(lifetimeConfig);
  return {
    enabled,
    priceEur: Number.isFinite(price) ? price : PAID_PLAN_DEFAULTS.priceEur,
    freeSubscriptionLimit: Number.isFinite(limit)
      ? Math.max(0, limit)
      : PAID_PLAN_DEFAULTS.freeSubscriptionLimit,
    annualBillingEnabled,
    annualPriceEur,
    lifetime,
  };
}

async function fetchPublicSystemSettings(): Promise<PublicSystemSettings> {
  const supabase = createPublicAnonSupabaseClient();
  if (!supabase) {
    return {
      systemName: DEFAULT_SYSTEM_NAME,
      brandLogo: null,
      displayPreferenceDefaults: DISPLAY_PREFERENCES_DEFAULTS,
      paidPlan: { ...PAID_PLAN_DEFAULTS },
      pwa: normalizePwaRow(null, DEFAULT_SYSTEM_NAME),
    };
  }

  const { data, error } = await supabase
    .from("system_settings")
    .select(
      "system_name, logo_revision, topbar_logo_revision, default_display_preferences, paid_plan_enabled, paid_plan_price_eur, paid_plan_free_subscription_limit, paid_plan_annual_enabled, paid_plan_annual_price_eur, paid_plan_lifetime_enabled, paid_plan_lifetime_price_eur, paid_plan_lifetime_ends_at, paid_plan_lifetime_purchase_limit, paid_plan_lifetime_purchase_count, pwa_enabled, pwa_install_banner_enabled, pwa_install_settings_enabled, pwa_cache_revision, pwa_theme_color, pwa_background_color, pwa_short_name",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return {
      systemName: DEFAULT_SYSTEM_NAME,
      brandLogo: null,
      displayPreferenceDefaults: DISPLAY_PREFERENCES_DEFAULTS,
      paidPlan: { ...PAID_PLAN_DEFAULTS },
      pwa: normalizePwaRow(null, DEFAULT_SYSTEM_NAME),
    };
  }

  const systemNameRaw = String((data as { system_name?: string }).system_name ?? "").trim();
  const systemName = systemNameRaw || DEFAULT_SYSTEM_NAME;
  const logoRevisionRaw = (data as { logo_revision?: unknown }).logo_revision;
  const logoRevision =
    typeof logoRevisionRaw === "number"
      ? Math.max(0, Math.trunc(logoRevisionRaw))
      : Number.parseInt(String(logoRevisionRaw ?? "0"), 10) || 0;
  const topbarLogoRevisionRaw = (data as { topbar_logo_revision?: unknown }).topbar_logo_revision;
  const topbarLogoRevision =
    typeof topbarLogoRevisionRaw === "number"
      ? Math.max(0, Math.trunc(topbarLogoRevisionRaw))
      : Number.parseInt(String(topbarLogoRevisionRaw ?? "0"), 10) || 0;
  const brandLogo = resolvePublicBrandLogoAssets(logoRevision, topbarLogoRevision);
  const partial = sanitizeDisplayPreferencesPartial(
    (data as { default_display_preferences?: unknown }).default_display_preferences,
  );
  const displayPreferenceDefaults = mergeDisplayPreferences(
    partial,
    DISPLAY_PREFERENCES_DEFAULTS,
  );

  const paidPlan = normalizePaidPlanRow(data);
  const pwa = normalizePwaRow(data, systemName);

  return { systemName, brandLogo, displayPreferenceDefaults, paidPlan, pwa };
}

/**
 * Publiski lasāmi sistēmas parametri (anon atslēga + RLS).
 * Pēc `/admin/system` saglabāšanas: `revalidateTag("system-settings")`.
 */
export async function getPublicSystemSettings(): Promise<PublicSystemSettings> {
  return unstable_cache(fetchPublicSystemSettings, ["subtrack-system-settings-v10"], {
    revalidate: 3600,
    tags: ["system-settings"],
  })();
}

/** Viens izsaukums uz pieprasījumu (`generateMetadata` + layout). */
export const getSystemSiteName = cache(async (): Promise<string> => {
  const s = await getPublicSystemSettings();
  return s.systemName;
});

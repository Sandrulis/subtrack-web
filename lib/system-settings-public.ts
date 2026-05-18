import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
  sanitizeDisplayPreferencesPartial,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";

/** Publiska maksas plāna pitch (landing + API limits); `enabled` no `system_settings`. */
export type SubtrackPublicPaidPlan = {
  enabled: boolean;
  priceEur: number;
  freeSubscriptionLimit: number;
};

export type PublicSystemSettings = {
  systemName: string;
  /** Pilns `DisplayPreferences`: koda `DISPLAY_PREFERENCES_DEFAULTS` + `default_display_preferences` no DB */
  displayPreferenceDefaults: DisplayPreferences;
  paidPlan: SubtrackPublicPaidPlan;
};

const PAID_PLAN_DEFAULTS: SubtrackPublicPaidPlan = {
  enabled: false,
  priceEur: 1.99,
  freeSubscriptionLimit: 5,
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
  return {
    enabled,
    priceEur: Number.isFinite(price) ? price : PAID_PLAN_DEFAULTS.priceEur,
    freeSubscriptionLimit: Number.isFinite(limit)
      ? Math.max(0, limit)
      : PAID_PLAN_DEFAULTS.freeSubscriptionLimit,
  };
}

async function fetchPublicSystemSettings(): Promise<PublicSystemSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return {
      systemName: "SubTrack",
      displayPreferenceDefaults: DISPLAY_PREFERENCES_DEFAULTS,
      paidPlan: { ...PAID_PLAN_DEFAULTS },
    };
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("system_settings")
    .select(
      "system_name, default_display_preferences, paid_plan_enabled, paid_plan_price_eur, paid_plan_free_subscription_limit",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return {
      systemName: "SubTrack",
      displayPreferenceDefaults: DISPLAY_PREFERENCES_DEFAULTS,
      paidPlan: { ...PAID_PLAN_DEFAULTS },
    };
  }

  const systemNameRaw = String((data as { system_name?: string }).system_name ?? "").trim();
  const systemName = systemNameRaw || "SubTrack";
  const partial = sanitizeDisplayPreferencesPartial(
    (data as { default_display_preferences?: unknown }).default_display_preferences,
  );
  const displayPreferenceDefaults = mergeDisplayPreferences(
    partial,
    DISPLAY_PREFERENCES_DEFAULTS,
  );

  const paidPlan = normalizePaidPlanRow(data);

  return { systemName, displayPreferenceDefaults, paidPlan };
}

/**
 * Publiski lasāmi sistēmas parametri (anon atslēga + RLS).
 * Pēc `/admin/system` saglabāšanas: `revalidateTag("system-settings")`.
 */
export async function getPublicSystemSettings(): Promise<PublicSystemSettings> {
  return unstable_cache(fetchPublicSystemSettings, ["subtrack-system-settings-v2"], {
    revalidate: 3600,
    tags: ["system-settings"],
  })();
}

/** Viens izsaukums uz pieprasījumu (`generateMetadata` + layout). */
export const getSystemSiteName = cache(async (): Promise<string> => {
  const s = await getPublicSystemSettings();
  return s.systemName;
});

import { loadEmailTemplatesStoreForSend } from "@/lib/emails/load-email-templates-store";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  formatDateForDisplayPreferences,
  mergeDisplayPreferencesForUser,
  resolveSystemDisplayPreferences,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";
import {
  normalizeEmailLocale,
  type EmailPreviewLocale,
  type EmailTemplatesStore,
} from "@/lib/emails/template-types";
import { readEmailNotificationPreferences } from "@/lib/emails/email-notification-preferences";

export function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export type EmailCronContext = {
  supabase: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>;
  siteUrl: string;
  systemName: string;
  currency: string;
  templatesStore: EmailTemplatesStore;
  /** Sistēmas noklusējums (`/admin/system`) virs `DISPLAY_PREFERENCES_DEFAULTS`. */
  systemDisplayPreferences: DisplayPreferences;
};

export async function loadEmailCronContext(): Promise<
  EmailCronContext | { error: string; status: number }
> {
  let supabase;
  try {
    supabase = createServiceRoleSupabaseClient();
    if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY nav iestatīts.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Service role nav pieejams.";
    return { error: msg, status: 500 };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  const [{ data: settings }, tplBundle] = await Promise.all([
    supabase
      .from("system_settings")
      .select("default_display_preferences")
      .eq("id", 1)
      .maybeSingle(),
    loadEmailTemplatesStoreForSend(),
  ]);

  if (!tplBundle) {
    return {
      error: "E-pasta šabloni nav pieejami (system_settings_email_templates).",
      status: 500,
    };
  }

  const systemDisplayPreferences = resolveSystemDisplayPreferences(
    settings?.default_display_preferences,
  );
  const currency = systemDisplayPreferences.currency;

  return {
    supabase,
    siteUrl,
    systemName: tplBundle.systemName,
    currency,
    templatesStore: tplBundle.store,
    systemDisplayPreferences,
  };
}

export function mergeUserDisplayPreferencesForEmail(
  userRaw: unknown,
  systemDisplayPreferences: DisplayPreferences,
): DisplayPreferences {
  return mergeDisplayPreferencesForUser(userRaw, systemDisplayPreferences);
}

/** Kalendāra datums e-pastā: lietotāja `date_order` / `date_sep` / TZ, citādi sistēmas defaults. */
export function formatCronEmailDate(
  date: Date,
  userRaw: unknown,
  systemDisplayPreferences: DisplayPreferences,
): string {
  const prefs = mergeUserDisplayPreferencesForEmail(userRaw, systemDisplayPreferences);
  const intlLocale = uiLocaleCodeToBcp47ForIntl(prefs.interface_language_code);
  return formatDateForDisplayPreferences(date, prefs, intlLocale);
}

export function parseUserLocaleAndTz(
  displayPreferences: unknown,
  systemDisplayPreferences: DisplayPreferences = DISPLAY_PREFERENCES_DEFAULTS,
): {
  locale: EmailPreviewLocale;
  timezone: string;
  weekStart: "monday" | "sunday";
} {
  const merged = mergeUserDisplayPreferencesForEmail(
    displayPreferences,
    systemDisplayPreferences,
  );
  return {
    locale: normalizeEmailLocale(merged.interface_language_code),
    timezone: merged.timezone,
    weekStart: merged.week_start,
  };
}

export function userWantsEmail(
  emailPrefsRaw: unknown,
  kind: "dueToday" | "weekly" | "trialEnd" | "winBack",
): boolean {
  return readEmailNotificationPreferences(emailPrefsRaw)[kind];
}

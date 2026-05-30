import { loadEmailTemplatesStoreForSend } from "@/lib/emails/load-email-templates-store";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getSystemSiteName } from "@/lib/system-settings-public";
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

export type ServiceRoleCronContext = {
  supabase: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>;
  siteUrl: string;
  systemName: string;
  systemDisplayPreferences: DisplayPreferences;
};

export type EmailCronContext = ServiceRoleCronContext & {
  currency: string;
  templatesStore: EmailTemplatesStore;
};

export async function loadServiceRoleCronContext(): Promise<
  ServiceRoleCronContext | { error: string; status: number }
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

  const [{ data: settings }, systemName] = await Promise.all([
    supabase
      .from("system_settings")
      .select("default_display_preferences")
      .eq("id", 1)
      .maybeSingle(),
    getSystemSiteName(),
  ]);

  const systemDisplayPreferences = resolveSystemDisplayPreferences(
    settings?.default_display_preferences,
  );

  return {
    supabase,
    siteUrl,
    systemName: systemName.trim() || DEFAULT_SYSTEM_NAME,
    systemDisplayPreferences,
  };
}

export async function loadEmailCronContext(): Promise<
  EmailCronContext | { error: string; status: number }
> {
  const base = await loadServiceRoleCronContext();
  if ("error" in base) {
    return base;
  }

  const tplBundle = await loadEmailTemplatesStoreForSend();
  if (!tplBundle) {
    return {
      error: "E-pasta šabloni nav pieejami (system_settings_email_templates).",
      status: 500,
    };
  }

  return {
    ...base,
    systemName: tplBundle.systemName,
    currency: base.systemDisplayPreferences.currency,
    templatesStore: tplBundle.store,
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

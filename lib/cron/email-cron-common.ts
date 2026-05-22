import {
  normalizeStoredEmailTemplates,
  sanitizeEmailTemplatesStore,
} from "@/lib/emails/merge-template-copy";
import { getSystemSiteName } from "@/lib/system-settings-public";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
} from "@/lib/user-display-preferences";
import { normalizeEmailLocale, type EmailPreviewLocale } from "@/lib/emails/template-types";
import { readEmailNotificationPreferences } from "@/lib/emails/email-notification-preferences";

export function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export type EmailCronContext = {
  supabase: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>;
  siteUrl: string;
  systemName: string;
  currency: string;
  templatesStore: ReturnType<typeof sanitizeEmailTemplatesStore>;
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
  const systemName = await getSystemSiteName();

  const [{ data: settings }, { data: emailTplRow }] = await Promise.all([
    supabase
      .from("system_settings")
      .select("default_display_preferences")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("system_settings_email_templates")
      .select("email_templates")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const prefs =
    settings?.default_display_preferences &&
    typeof settings.default_display_preferences === "object"
      ? (settings.default_display_preferences as Record<string, unknown>)
      : {};
  const currency =
    typeof prefs.currency === "string" && prefs.currency.trim()
      ? prefs.currency.trim()
      : DISPLAY_PREFERENCES_DEFAULTS.currency;

  const templatesStore = normalizeStoredEmailTemplates(
    sanitizeEmailTemplatesStore(emailTplRow?.email_templates),
    systemName,
  );

  return { supabase, siteUrl, systemName, currency, templatesStore };
}

export function parseUserLocaleAndTz(displayPreferences: unknown): {
  locale: EmailPreviewLocale;
  timezone: string;
  weekStart: "monday" | "sunday";
} {
  const merged = mergeDisplayPreferences({}, DISPLAY_PREFERENCES_DEFAULTS);
  if (displayPreferences && typeof displayPreferences === "object") {
    const o = displayPreferences as Record<string, unknown>;
    const code = String(o.interface_language_code ?? "").trim();
    if (code) merged.interface_language_code = code;
    const tz = String(o.timezone ?? "").trim();
    if (tz) merged.timezone = tz;
    const ws = String(o.week_start ?? "").trim();
    if (ws === "monday" || ws === "sunday") merged.week_start = ws;
  }
  return {
    locale: normalizeEmailLocale(merged.interface_language_code),
    timezone: merged.timezone,
    weekStart: merged.week_start,
  };
}

export function userWantsEmail(
  emailPrefsRaw: unknown,
  kind: "dueToday" | "weekly" | "trialEnd",
): boolean {
  return readEmailNotificationPreferences(emailPrefsRaw)[kind];
}

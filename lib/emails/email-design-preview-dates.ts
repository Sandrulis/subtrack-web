import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import {
  formatDateForDisplayPreferences,
  mergeDisplayPreferencesForUser,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";
import type { EmailPreviewLocale } from "./template-types";

/** Fiksēti ISO paraugi admin e-pasta dizaina priekšskatījumam. */
export const EMAIL_DESIGN_PREVIEW_ISO = {
  dueToday: "2026-05-10",
  trialEnd: "2026-05-26",
  winBackLastSeen7d: "2026-05-22",
  winBackLastSeen30d: "2026-04-29",
  weeklyToday: "2026-05-19",
  weeklyStart: "2026-05-19",
  weeklyEnd: "2026-05-25",
} as const;

/**
 * Admin priekšskatījums bez konkrēta lietotāja: tikai sistēmas defaults
 * (kā cron, ja lietotājs nav definējis `display_preferences` laukus).
 * Valoda = rediģējamā e-pasta locale.
 */
export function prefsForEmailDesignPreview(
  emailLocale: EmailPreviewLocale,
  systemDefaults: Partial<DisplayPreferences> | null | undefined,
): DisplayPreferences {
  const prefs = mergeDisplayPreferencesForUser({}, systemDefaults);
  return { ...prefs, interface_language_code: emailLocale };
}

/** Kalendāra datums priekšskatījumā (sistēmas `date_order` / `date_sep` / TZ). */
export function formatEmailDesignPreviewDate(
  isoDate: string,
  emailLocale: EmailPreviewLocale,
  systemDefaults?: Partial<DisplayPreferences> | null,
): string {
  const prefs = prefsForEmailDesignPreview(emailLocale, systemDefaults);
  const intlLocale = uiLocaleCodeToBcp47ForIntl(emailLocale);
  return formatDateForDisplayPreferences(
    new Date(`${isoDate}T12:00:00Z`),
    prefs,
    intlLocale,
  );
}

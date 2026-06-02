import type { NavBrandSnapshot } from "@/lib/brand/nav-brand-snapshot";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { SettingsFsViewClient } from "@/components/fs/settings-fs-view-client";
import type { DisplayPreferences } from "@/lib/user-display-preferences";

export type SettingsLanguageOption = {
  code: string;
  label: string;
};

export function SettingsFsView({
  brand = null,
  userDisplay,
  accountEmail = "",
  dbPreferencesRaw,
  languageOptions,
  preferenceBase,
  emailNotificationPreferencesRaw,
  flashError,
  flashMessage,
}: {
  brand?: NavBrandSnapshot | null;
  userDisplay?: NavUserDisplay | null;
  /** Sesijas e-pasts konta dzēšanas apstiprinājumam */
  accountEmail?: string;
  dbPreferencesRaw: unknown | null;
  /** No `languages` tabulas; ja tukšs `[]`, atlasei izmantoti statiski pagaidu varianti */
  languageOptions: SettingsLanguageOption[];
  /**
   * Apvienotas preferences: sistēmas noklusējumi + `languages.is_default` kā
   * `interface_language_code` (`getPublicSystemSettings` + valodu katalogs).
   */
  preferenceBase: DisplayPreferences;
  emailNotificationPreferencesRaw: unknown;
  flashError?: string;
  flashMessage?: string;
}) {
  return (
    <SettingsFsViewClient
      brand={brand}
      userDisplay={userDisplay}
      accountEmail={accountEmail}
      dbPreferencesRaw={dbPreferencesRaw}
      languageOptions={languageOptions}
      preferenceBase={preferenceBase}
      emailNotificationPreferencesRaw={emailNotificationPreferencesRaw}
      flashError={flashError}
      flashMessage={flashMessage}
    />
  );
}

import type { Metadata } from "next";
import type { SettingsLanguageOption } from "@/components/fs/settings-fs-view";
import { FsNotifyI18nBootstrap } from "@/components/fs/fs-notify-i18n-bootstrap";
import { SettingsFsView } from "@/components/fs/settings-fs-view";
import { getSessionDisplayPreferencesRow } from "@/lib/auth/display-preferences-server";
import { getSessionUserDisplay } from "@/lib/auth/user-display";
import { getLanguagesCatalog } from "@/lib/languages-catalog";
import { getPublicSystemSettings } from "@/lib/system-settings-public";
import { mergeDisplayPreferences } from "@/lib/user-display-preferences";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest, resolveRequestUiLocales } from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.app.settings"),
  };
}

/** Ja valodu tabulas vēl nav migrācijas, forma joprojām lietojama. */
const FALLBACK_LANGUAGE_OPTIONS: SettingsLanguageOption[] = [
  { code: "lv", label: "Latviešu" },
  { code: "en", label: "English" },
];

type LangDbRow = { code: string; label: string };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; disable?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { locale } = await resolveRequestUiLocales();
  const collLocale = uiLocaleCodeToBcp47ForIntl(locale);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [userDisplay, dbPreferencesRaw, languagesRes, catalog, publicSys] = await Promise.all([
    getSessionUserDisplay(),
    getSessionDisplayPreferencesRow(),
    supabase.from("languages").select("code, label").order("label", { ascending: true }),
    getLanguagesCatalog(),
    getPublicSystemSettings(),
  ]);

  const accountEmail = (authUser?.email ?? "").trim();

  let emailNotificationPreferencesRaw: unknown = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("email_notification_preferences")
      .eq("id", authUser.id)
      .maybeSingle();
    emailNotificationPreferencesRaw = data?.email_notification_preferences ?? null;
  }

  let languageOptions: SettingsLanguageOption[] = [];

  const rowsErr = languagesRes.error;
  const rows = (languagesRes.data ?? []) as LangDbRow[];
  if (!rowsErr && rows.length > 0) {
    languageOptions = rows.map((r) => ({
      code: String(r.code).trim().toLowerCase(),
      label: String(r.label).trim(),
    }));
    const collator = new Intl.Collator(collLocale, { sensitivity: "base" });
    languageOptions.sort((a, b) => collator.compare(a.label, b.label));
  } else {
    languageOptions = FALLBACK_LANGUAGE_OPTIONS;
  }

  const preferenceBase = mergeDisplayPreferences(
    { interface_language_code: catalog.defaultCode.trim().toLowerCase() },
    publicSys.displayPreferenceDefaults,
  );

  return (
    <div className="auth-page">
      <FsNotifyI18nBootstrap />
      <SettingsFsView
        brand={{
          label: publicSys.systemName,
          logoTopbar: publicSys.brandLogo?.topbar ?? null,
        }}
        userDisplay={userDisplay}
        accountEmail={accountEmail}
        dbPreferencesRaw={dbPreferencesRaw}
        languageOptions={languageOptions}
        preferenceBase={preferenceBase}
        emailNotificationPreferencesRaw={emailNotificationPreferencesRaw}
        flashError={sp.error}
        flashMessage={sp.message}
      />
    </div>
  );
}

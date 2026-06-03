"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { NavDash } from "@/components/nav-dash";
import type { NavBrandSnapshot } from "@/lib/brand/nav-brand-snapshot";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { updateSessionDisplayPreferences } from "@/lib/auth/display-preferences-client";
import {
  type DisplayPreferences,
  formatDisplayPreferencesPreview,
  mergeDisplayPreferences,
  mergeDisplayPreferencesFromSources,
  readDisplayPreferencesFromLocalStorage,
  writeDisplayPreferencesToLocalStorage,
} from "@/lib/user-display-preferences";
import type { SettingsLanguageOption } from "@/components/fs/settings-fs-view";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import { applyUiLocaleInBrowser } from "@/lib/html-lang";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import {
  AppPageContentGate,
} from "@/components/app/app-page-content-gate";
import { FlashParamToast } from "@/components/flash-param-toast";
import { SettingsChangePasswordPanel } from "@/components/settings/settings-change-password-panel";
import { SettingsDeleteAccountPanel } from "@/components/settings/settings-delete-account-panel";
import { SettingsEmailNotificationsPanel } from "@/components/settings/settings-email-notifications-panel";

function pickInterfaceLanguageAgainstCatalog(
  code: string,
  catalog: SettingsLanguageOption[],
  systemDefaultCode: string,
): string {
  if (!catalog.length) return code;
  if (catalog.some((o) => o.code === code)) return code;
  const def = systemDefaultCode.trim().toLowerCase();
  if (catalog.some((o) => o.code === def)) return def;
  return catalog[0]!.code;
}

const AUTOSAVE_DEBOUNCE_MS = 450;

export function SettingsFsViewClient({
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
  accountEmail?: string;
  /** No servera: `users.display_preferences` vai null */
  dbPreferencesRaw: unknown | null;
  languageOptions: SettingsLanguageOption[];
  preferenceBase: DisplayPreferences;
  emailNotificationPreferencesRaw: unknown;
  flashError?: string;
  flashMessage?: string;
}) {
  const [prefs, setPrefs] = useState<DisplayPreferences>(() =>
    mergeDisplayPreferences({}, preferenceBase),
  );
  const [hydrated, setHydrated] = useState(false);

  const router = useRouter();

  const { t, locale } = useSubtrackIntl();
  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);

  const latestPrefsRef = useRef(prefs);
  latestPrefsRef.current = prefs;

  const hydratedRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistSnapshotRef = useRef<(snapshot: DisplayPreferences) => Promise<void>>(
    async () => {},
  );

  async function persistSnapshot(snapshot: DisplayPreferences): Promise<void> {
    pushDomToast(t("settings.toast_server_saving"), "info");
    try {
      if (!writeDisplayPreferencesToLocalStorage(snapshot)) {
        pushDomToast(t("settings.toast_browser_fail"), "error");
        return;
      }
      applyUiLocaleInBrowser(snapshot.interface_language_code);

      const saved = await updateSessionDisplayPreferences(snapshot);
      if (!saved.ok) {
        if (saved.reason === "no_user") {
          pushDomToast(t("settings.toast_local_only"), "error");
          return;
        }
        const raw = (saved.message || "").trim();
        const detail = raw.length > 0 ? raw : t("settings.toast_server_unknown_error");
        pushDomToast(`${t("settings.toast_generic_server_error_prefix")} ${detail}`, "error");
        return;
      }
      pushDomToast(t("settings.toast_saved"), "success");
    } catch {
      pushDomToast(t("settings.toast_save_connection_failure"), "error");
    }
  }

  persistSnapshotRef.current = persistSnapshot;

  const languageOptionCodesKey = useMemo(
    () => languageOptions.map((o) => o.code).sort().join("\0"),
    [languageOptions],
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const local = readDisplayPreferencesFromLocalStorage();
      let merged = mergeDisplayPreferencesFromSources(local, dbPreferencesRaw, preferenceBase, {
        prioritizeDbInterfaceLanguage: dbPreferencesRaw != null,
      });
      merged = mergeDisplayPreferences(merged, preferenceBase);
      if (languageOptions.length > 0) {
        merged = mergeDisplayPreferences(
          {
            ...merged,
            interface_language_code: pickInterfaceLanguageAgainstCatalog(
              merged.interface_language_code,
              languageOptions,
              preferenceBase.interface_language_code,
            ),
          },
          preferenceBase,
        );
      }
      setPrefs(merged);
      applyUiLocaleInBrowser(merged.interface_language_code);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [dbPreferencesRaw, languageOptionCodesKey, preferenceBase]);

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      if (hydratedRef.current) {
        void persistSnapshotRef.current(latestPrefsRef.current);
      }
    };
  }, []);

  const previewText = useMemo(
    () =>
      formatDisplayPreferencesPreview(prefs, intlLocale, {
        week: t("preferences.preview.label_week"),
        currency: t("preferences.preview.label_currency"),
        ui: t("preferences.preview.label_ui"),
      }),
    [intlLocale, prefs, t],
  );

  function scheduleAutosave(nextSnapshot: DisplayPreferences): void {
    if (!hydratedRef.current) return;
    latestPrefsRef.current = nextSnapshot;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      void persistSnapshotRef.current(latestPrefsRef.current);
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  function updateField<K extends keyof DisplayPreferences>(
    key: K,
    value: DisplayPreferences[K],
  ): void {
    setPrefs((p) => {
      let next = mergeDisplayPreferences({ ...p, [key]: value }, preferenceBase);

      if (key === "interface_language_code") {
        const picked = pickInterfaceLanguageAgainstCatalog(
          typeof value === "string" ? value : String(value ?? ""),
          languageOptions,
          preferenceBase.interface_language_code,
        );
        next = mergeDisplayPreferences(
          { ...next, interface_language_code: picked, interface_language_user_set: true },
          preferenceBase,
        );
        applyUiLocaleInBrowser(next.interface_language_code);
        writeDisplayPreferencesToLocalStorage(next);
        queueMicrotask(() => {
          router.refresh();
        });
      }

      scheduleAutosave(next);
      return next;
    });
  }

  return (
    <>
      <NavDash active="" userDisplay={userDisplay} brand={brand} />
      <AppPageContentGate ready={hydrated}>
        <div className="auth-page-inner auth-page-inner--settings-hub">
          <div className="settings-hub">
            <div className="settings-hub__primary">
              <div className="auth-card auth-card--settings auth-card--form">
                <div className="auth-card-icon">
                  <i className="fa-solid fa-sliders fa-xl" aria-hidden="true" />
                </div>
                <h1>{t("settings.page_heading")}</h1>

                <form
                  id="settings-form"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
            <p className="form-section-label">{t("settings.section_language")}</p>
            <div className="form-group">
              <label htmlFor="set-ui-lang">{t("settings.label_language_default")}</label>
              <select
                id="set-ui-lang"
                name="interface_language_code"
                className="form-select"
                value={prefs.interface_language_code}
                disabled={!hydrated}
                onChange={(e) => updateField("interface_language_code", e.target.value)}
              >
                {languageOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label} ({opt.code})
                  </option>
                ))}
              </select>
            </div>

            <p className="form-section-label form-section-label--spaced">{t("settings.section_currency")}</p>
            <div className="form-group">
              <label htmlFor="set-currency">{t("admin.forms.section_currency")}</label>
              <select
                id="set-currency"
                name="currency"
                className="form-select"
                value={prefs.currency}
                disabled={!hydrated}
                onChange={(e) =>
                  updateField("currency", e.target.value as DisplayPreferences["currency"])
                }
              >
                <option value="EUR">{t("settings.currency_eur_label")}</option>
                <option value="USD">{t("settings.currency_usd_label")}</option>
                <option value="GBP">{t("settings.currency_gbp_label")}</option>
                <option value="SEK">{t("settings.currency_sek_label")}</option>
                <option value="PLN">{t("settings.currency_pln_label")}</option>
                <option value="CHF">{t("settings.currency_chf_label")}</option>
              </select>
            </div>

            <p className="form-section-label form-section-label--spaced">{t("settings.section_budget")}</p>
            <div className="form-group">
              <label htmlFor="set-monthly-budget">{t("settings.label_monthly_budget")}</label>
              <input
                id="set-monthly-budget"
                name="monthly_budget"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                placeholder={t("settings.placeholder_monthly_budget")}
                value={prefs.monthly_budget ?? ""}
                disabled={!hydrated}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") {
                    updateField("monthly_budget", null);
                    return;
                  }
                  const parsed = Number.parseFloat(raw.replace(",", "."));
                  updateField(
                    "monthly_budget",
                    Number.isFinite(parsed) && parsed >= 0 ? parsed : null,
                  );
                }}
              />
              <p className="form-hint form-hint--settings-under-select">
                {t("settings.hint_monthly_budget")}
              </p>
            </div>

            <p className="form-section-label form-section-label--spaced">{t("admin.forms.section_date")}</p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="set-date-order">{t("admin.forms.label_date_order")}</label>
                <select
                  id="set-date-order"
                  name="date_order"
                  className="form-select"
                  value={prefs.date_order}
                  disabled={!hydrated}
                  onChange={(e) =>
                    updateField(
                      "date_order",
                      e.target.value as DisplayPreferences["date_order"],
                    )
                  }
                >
                  <option value="dmy">{t("settings.option_date_order_dmy")}</option>
                  <option value="ymd">{t("settings.option_date_order_ymd")}</option>
                  <option value="mdy">{t("settings.option_date_order_mdy")}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="set-date-sep">{t("admin.forms.label_date_sep")}</label>
                <select
                  id="set-date-sep"
                  name="date_sep"
                  className="form-select"
                  value={prefs.date_sep}
                  disabled={!hydrated}
                  onChange={(e) =>
                    updateField("date_sep", e.target.value as DisplayPreferences["date_sep"])
                  }
                >
                  <option value=".">{t("settings.option_date_sep_dot")}</option>
                  <option value="-">{t("settings.option_date_sep_dash")}</option>
                  <option value="/">{t("settings.option_date_sep_slash")}</option>
                </select>
              </div>
            </div>

            <p className="form-section-label form-section-label--spaced">{t("admin.forms.section_time")}</p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="set-time-format">{t("admin.forms.label_time_fmt")}</label>
                <select
                  id="set-time-format"
                  name="time_format"
                  className="form-select"
                  value={prefs.time_format}
                  disabled={!hydrated}
                  onChange={(e) =>
                    updateField(
                      "time_format",
                      e.target.value as DisplayPreferences["time_format"],
                    )
                  }
                >
                  <option value="24">{t("settings.option_time_24")}</option>
                  <option value="12">{t("settings.option_time_12")}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="set-time-sep">{t("admin.forms.label_time_sep_field")}</label>
                <select
                  id="set-time-sep"
                  name="time_sep"
                  className="form-select"
                  value={prefs.time_sep}
                  disabled={!hydrated}
                  onChange={(e) =>
                    updateField("time_sep", e.target.value as DisplayPreferences["time_sep"])
                  }
                >
                  <option value=":">{t("settings.option_clock_sep_colon")}</option>
                  <option value=".">{t("settings.option_clock_sep_dot")}</option>
                </select>
                <p className="form-hint form-hint--settings-under-select">
                  {t("settings.hint_hours_minutes_sep")}
                </p>
              </div>
            </div>

            <p className="form-section-label form-section-label--spaced">{t("admin.forms.section_tz")}</p>
            <div className="form-group">
              <label htmlFor="set-tz">{t("admin.forms.label_timezone")}</label>
              <select
                id="set-tz"
                name="timezone"
                className="form-select"
                value={prefs.timezone}
                disabled={!hydrated}
                onChange={(e) => updateField("timezone", e.target.value)}
              >
                <option value="Europe/Riga">{t("settings.tz_europe_riga")}</option>
                <option value="Europe/Tallinn">{t("settings.tz_europe_tallinn")}</option>
                <option value="Europe/Vilnius">{t("settings.tz_europe_vilnius")}</option>
                <option value="Europe/Helsinki">{t("settings.tz_europe_helsinki")}</option>
                <option value="Europe/Warsaw">{t("settings.tz_europe_warsaw")}</option>
                <option value="Europe/Berlin">{t("settings.tz_europe_berlin")}</option>
                <option value="Europe/Paris">{t("settings.tz_europe_paris")}</option>
                <option value="Europe/London">{t("settings.tz_europe_london")}</option>
                <option value="UTC">{t("settings.tz_utc")}</option>
                <option value="America/New_York">{t("settings.tz_america_new_york")}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="set-week-start">{t("admin.forms.label_week_start")}</label>
              <select
                id="set-week-start"
                name="week_start"
                className="form-select"
                value={prefs.week_start}
                disabled={!hydrated}
                onChange={(e) =>
                  updateField(
                    "week_start",
                    e.target.value as DisplayPreferences["week_start"],
                  )
                }
              >
                <option value="monday">{t("admin.forms.week_mon")}</option>
                <option value="sunday">{t("admin.forms.week_sun")}</option>
              </select>
            </div>

            <div
              className="dash-settings-hint-box"
              id="settings-preview"
              aria-live="polite"
            >
              <strong>{t("settings.preview_label")}</strong>{" "}
              <span id="settings-preview-body">{previewText}</span>
            </div>
          </form>

              <p className="auth-footer settings-hub-dashboard-link">
                <Link href="/dashboard">{t("settings.link_dashboard")}</Link>
              </p>
            </div>
            </div>

            <div className="settings-hub__secondary">
              <SettingsChangePasswordPanel />
              <Suspense fallback={null}>
                <SettingsEmailNotificationsPanel
                  userDisplay={userDisplay}
                  initialPreferences={emailNotificationPreferencesRaw}
                />
              </Suspense>
              <SettingsDeleteAccountPanel
                userDisplay={userDisplay}
                accountEmail={accountEmail}
                ready={hydrated}
              />
            </div>
          </div>
        </div>
      </AppPageContentGate>

      <SiteLandingFooter />

      <div className="toast-container toast-container--auth-pages" id="toast-container">
        <FlashParamToast error={flashError} message={flashMessage} />
      </div>
    </>
  );
}

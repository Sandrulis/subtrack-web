"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NavDash } from "@/components/nav-dash";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  type DisplayPreferences,
  formatDisplayPreferencesPreview,
  mergeDisplayPreferences,
  mergeDisplayPreferencesFromSources,
  readDisplayPreferencesFromLocalStorage,
  writeDisplayPreferencesToLocalStorage,
} from "@/lib/user-display-preferences";

function pushToast(msg: string, type: "success" | "error") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const prefix =
    type === "success"
      ? '<i class="fa-solid fa-check"></i> '
      : '<i class="fa-solid fa-circle-exclamation"></i> ';
  const esc = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  toast.innerHTML = prefix + esc(msg);
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity .3s";
    setTimeout(() => toast.remove(), 320);
  }, 2800);
}

export function SettingsFsViewClient({
  userDisplay,
  dbPreferencesRaw,
}: {
  userDisplay?: NavUserDisplay | null;
  /** No servera: `users.display_preferences` vai null */
  dbPreferencesRaw: unknown | null;
}) {
  const year = new Date().getFullYear();
  const [prefs, setPrefs] = useState<DisplayPreferences>(() =>
    mergeDisplayPreferences({}),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const local = readDisplayPreferencesFromLocalStorage();
      const merged = mergeDisplayPreferencesFromSources(local, dbPreferencesRaw);
      setPrefs(merged);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [dbPreferencesRaw]);

  const previewText = useMemo(() => formatDisplayPreferencesPreview(prefs), [prefs]);

  function updateField<K extends keyof DisplayPreferences>(
    key: K,
    value: DisplayPreferences[K],
  ) {
    setPrefs((p) => mergeDisplayPreferences({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = mergeDisplayPreferences(prefs);
    let savedRemote = false;
    let serverProblem: string | null = null;

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        pushToast("Nav aktīvas sesijas.", "error");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({ display_preferences: next })
        .eq("id", user.id);

      if (error) {
        serverProblem = error.message || "Neizdevās saglabāt serverī.";
      } else {
        savedRemote = true;
      }
    } catch {
      serverProblem = "Neizdevās savienoties ar serveri.";
    }

    if (!writeDisplayPreferencesToLocalStorage(next)) {
      pushToast("Neizdevās saglabāt pārlūkā (localStorage).", "error");
      return;
    }

    if (savedRemote) {
      pushToast("Iestatījumi saglabāti kontā un pārlūkā.", "success");
    } else if (serverProblem) {
      pushToast(`Saglabāti pārlūkā. ${serverProblem}`, "error");
    } else {
      pushToast("Saglabāti pārlūkā.", "success");
    }
  }

  return (
    <>
      <NavDash active="" userDisplay={userDisplay} />
      <div className="auth-page-inner">
        <div className="auth-card auth-card--settings auth-card--form">
          <div className="auth-card-icon">
            <i className="fa-solid fa-sliders fa-xl" aria-hidden="true" />
          </div>
          <h1>Iestatījumi</h1>
          <p className="auth-subtitle">
            Noklusējuma valūta, datumu un laiku parādīšana, laika josla un
            kalendāra nedēļas sākums. Vērtības tiek saglabātas tavā kontā un
            dublētas pārlūkā ērtai ielādei.
          </p>

          <form id="settings-form" noValidate onSubmit={onSubmit}>
            <p className="form-section-label">Valūta</p>
            <div className="form-group">
              <label htmlFor="set-currency">Noklusējuma valūta</label>
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
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="SEK">SEK (kr)</option>
                <option value="PLN">PLN (zł)</option>
                <option value="CHF">CHF (Fr)</option>
              </select>
            </div>

            <p className="form-section-label form-section-label--spaced">
              Datuma formāts
            </p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="set-date-order">Komponentu secība</label>
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
                  <option value="dmy">07.06.2024</option>
                  <option value="ymd">2024.06.07</option>
                  <option value="mdy">06.07.2024</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="set-date-sep">Datuma atdalītājs</label>
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
                  <option value=".">Punkts (.) - 07.06.2024</option>
                  <option value="-">Defise (-) - 07-06-2024</option>
                  <option value="/">Slīpsvītra (/) - 07/06/2024</option>
                </select>
              </div>
            </div>

            <p className="form-section-label form-section-label--spaced">
              Laika formāts
            </p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="set-time-format">Formāts</label>
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
                  <option value="24">24 stundas (piem., 14:30)</option>
                  <option value="12">12 stundas (piem., 2:30 pēcpusdiena)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="set-time-sep">Laika atdalītājs</label>
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
                  <option value=":">Divkrops (:)</option>
                  <option value=".">Punkts (.)</option>
                </select>
                <p className="form-hint form-hint--settings-under-select">
                  Stundas un minūtes starpā.
                </p>
              </div>
            </div>

            <p className="form-section-label form-section-label--spaced">
              Laika zona un nedēļa
            </p>
            <div className="form-group">
              <label htmlFor="set-tz">Laika zona</label>
              <select
                id="set-tz"
                name="timezone"
                className="form-select"
                value={prefs.timezone}
                disabled={!hydrated}
                onChange={(e) => updateField("timezone", e.target.value)}
              >
                <option value="Europe/Riga">Eiropa/Rīga</option>
                <option value="Europe/Tallinn">Eiropa/Tallina</option>
                <option value="Europe/Vilnius">Eiropa/Viļņa</option>
                <option value="Europe/Helsinki">Eiropa/Helsinki</option>
                <option value="Europe/Warsaw">Eiropa/Varšava</option>
                <option value="Europe/Berlin">Eiropa/Berlīne</option>
                <option value="Europe/Paris">Eiropa/Parīze</option>
                <option value="Europe/London">Eiropa/Londona</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Amerika/New_York</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="set-week-start">Kalendārā nedēļa sākas ar</label>
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
                <option value="monday">Pirmdienu</option>
                <option value="sunday">Svētdienu</option>
              </select>
            </div>

            <div
              className="dash-settings-hint-box"
              id="settings-preview"
              aria-live="polite"
            >
              <strong>Piemērs:</strong>{" "}
              <span id="settings-preview-body">{previewText}</span>
            </div>

            <div className="auth-submit-wrap">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={!hydrated}
              >
                <i className="fa-solid fa-floppy-disk" aria-hidden="true" />{" "}
                Saglabāt iestatījumus
              </button>
            </div>
          </form>

          <p className="auth-footer">
            <Link href="/dashboard">Atpakaļ uz paneli</Link>
          </p>
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; {year} SubTrack. Visi tiesības aizsargātas.</p>
      </footer>

      <div className="toast-container" id="toast-container" />
    </>
  );
}

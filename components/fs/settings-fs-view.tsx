"use client";

import Link from "next/link";
import { NavDash } from "@/components/nav-dash";
import { FsScripts } from "@/components/fs/load-fs-scripts";

const SETTINGS_SCRIPTS = [
  "/fs/js/subscriptions-helpers.js",
  "/fs/js/settings.js",
] as const;

export function SettingsFsView() {
  const year = new Date().getFullYear();

  return (
    <>
      <NavDash active="" />
      <div className="auth-page-inner">
        <div className="auth-card auth-card--settings auth-card--form">
          <div className="auth-card-icon">
            <i className="fa-solid fa-sliders fa-xl" aria-hidden="true" />
          </div>
          <h1>Iestatījumi</h1>
          <p className="auth-subtitle">
            Noklusējuma valūta, datumu un laiku parādīšana, laika josla un
            kalendāra nedēļas sākums. Saglabātās vērtības tiek pierakstītas
            pārlūkprogrammā (localStorage) šī prototipa ietvaros.
          </p>

          <form action="#" method="post" id="settings-form" noValidate>
            <p className="form-section-label">Valūta</p>
            <div className="form-group">
              <label htmlFor="set-currency">Noklusējuma valūta</label>
              <select id="set-currency" name="currency" className="form-select">
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
                >
                  <option value="24">24 stundas (piem., 14:30)</option>
                  <option value="12">12 stundas (piem., 2:30 pēcpusdiena)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="set-time-sep">Laika atdalītājs</label>
                <select id="set-time-sep" name="time_sep" className="form-select">
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
              <select id="set-tz" name="timezone" className="form-select">
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
              <span id="settings-preview-body">–</span>
            </div>

            <div className="auth-submit-wrap">
              <button type="submit" className="btn btn-primary btn-block">
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
        <p>
          &copy; {year} SubTrack. Visi tiesības aizsargātas.
        </p>
      </footer>

      <div className="toast-container" id="toast-container" />

      <FsScripts srcs={SETTINGS_SCRIPTS} />
    </>
  );
}

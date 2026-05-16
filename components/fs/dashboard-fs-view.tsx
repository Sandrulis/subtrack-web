"use client";

import { NavDash } from "@/components/nav-dash";
import { FsScripts } from "@/components/fs/load-fs-scripts";
import {
  FA_ICONS_MORE,
  FA_ICONS_PREVIEW,
  FS_COLOR_DOTS,
} from "@/lib/fs-icons";

const DASH_SCRIPTS = [
  "/fs/js/subscriptions-data.js",
  "/fs/js/subscriptions-helpers.js",
  "/fs/js/dash-notifications.js",
  "/fs/js/dashboard.js",
] as const;

export function DashboardFsView() {
  const year = new Date().getFullYear();

  return (
    <>
      <div className="app-layout app-layout-stacked">
        <NavDash active="dashboard" />
        <main className="main-content">
          <div className="dashboard-top-split">
            <div className="dashboard-top-calendar">
              <div className="pay-calendar-card">
                <div className="pay-calendar-toolbar">
                  <button
                    type="button"
                    className="pay-cal-nav"
                    id="cal-prev"
                    aria-label="Iepriekšējais mēnesis"
                  >
                    <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                  </button>
                  <h2 className="pay-calendar-title" id="pay-calendar-title">
                    Kalendārs
                  </h2>
                  <button
                    type="button"
                    className="pay-cal-nav"
                    id="cal-next"
                    aria-label="Nākamais mēnesis"
                  >
                    <i
                      className="fa-solid fa-chevron-right"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <div
                  id="pay-calendar"
                  className="pay-calendar"
                  role="region"
                  aria-labelledby="pay-calendar-title"
                />
                <p className="pay-calendar-hint">
                  <span
                    className="pay-cal-legend-i pay-cal-legend-i--due"
                    aria-hidden="true"
                  />
                  gaidāms maksājums
                  <span className="pay-calendar-hint-sep">·</span>
                  <span
                    className="pay-cal-legend-i pay-cal-legend-i--overdue"
                    aria-hidden="true"
                  />
                  kavēts
                </p>
              </div>
            </div>

            <div className="dashboard-top-aside">
              <div className="page-header">
                <div>
                  <h1 className="page-title">Abonamenti</h1>
                  <p className="page-subtitle">
                    Pārvaldiet savus ikmēneša abonementus
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.openAddModal?.()}
                >
                  <i className="fa-solid fa-plus" /> Pievienot
                </button>
              </div>

              <div className="stats-row stats-row--aside">
                <div className="stat-card">
                  <div className="stat-label">Kopējā mēneša summa</div>
                  <div className="stat-value" id="stat-total">
                    €0.00
                  </div>
                  <div className="stat-note">par mēnesi</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Aktīvie abonamenti</div>
                  <div className="stat-value" id="stat-count">
                    0
                  </div>
                  <div className="stat-note">kopā</div>
                </div>
                <div className="stat-card stat-card--next-pay">
                  <div className="stat-label">Nākamais maksājums</div>
                  <div className="stat-next-body">
                    <div className="stat-next-text">
                      <div className="stat-value stat-value--next" id="stat-next">
                        -
                      </div>
                      <div className="stat-next-name" id="stat-next-name">
                        nav abonementa
                      </div>
                    </div>
                    <div className="stat-next-amount" id="stat-next-amount" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-header">
            <h2 className="section-heading">Jūsu abonamenti</h2>
          </div>

          <div id="sub-list" className="sub-list" />

          <div id="empty-state" className="empty-state hidden">
            <div>
              <i className="fa-solid fa-receipt empty-icon-fa" />
            </div>
            <h3>Nav abonementa</h3>
            <p>Pievienojiet savu pirmo abonementu, lai sāktu sekot izdevumiem.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.openAddModal?.()}
            >
              <i className="fa-solid fa-plus" /> Pievienot pirmo
            </button>
          </div>
        </main>

        <footer className="landing-footer">
          <p>
            &copy; {year} SubTrack. Visi tiesības aizsargātas.
          </p>
        </footer>
      </div>

      <div
        className="modal-overlay"
        id="modal-overlay"
        onClick={(e) => window.handleOverlayClick?.(e.nativeEvent)}
      >
        <div className="modal modal--wide" id="modal-main">
          <div className="modal-header">
            <h2 id="modal-title">Pievienot abonementu</h2>
            <button
              type="button"
              className="modal-close"
              onClick={() => window.closeModal?.()}
              aria-label="Aizvērt"
              data-tooltip="Aizvērt"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="sub-name">Nosaukums</label>
              <input
                type="text"
                id="sub-name"
                placeholder="piem. Netflix, Spotify..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="sub-category">Kategorija</label>
              <select id="sub-category" className="form-select">
                <option value="subscription">Abonements</option>
                <option value="bill">Rēķins</option>
                <option value="credit">Kredīts</option>
                <option value="leasing">Līzings</option>
                <option value="insurance">Apdrošināšana</option>
                <option value="other">Citi maksājumi</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sub-amount">Summa (€)</label>
                <input
                  type="number"
                  id="sub-amount"
                  placeholder="9.99"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="sub-period">Periods</label>
                <select id="sub-period" className="form-select">
                  <option value="monthly">Mēnesī</option>
                  <option value="yearly">Gadā</option>
                  <option value="weekly">Nedēļā</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sub-date">Nākamais maksājums</label>
              <input type="date" id="sub-date" />
            </div>

            <div className="form-group">
              <label>Ikona</label>
              <div className="icon-picker-block" id="icon-picker">
                <div
                  className="icon-picker-row icon-picker-row--preview"
                  role="group"
                  aria-label="Ikona"
                >
                  {FA_ICONS_PREVIEW.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      className="icon-opt"
                      data-icon={ic}
                    >
                      <i className={ic} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                {FA_ICONS_MORE.length > 0 ? (
                  <>
                    <div className="icon-picker-toolbar">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm icon-picker-toggle"
                        id="icon-picker-toggle"
                        onClick={() => window.toggleIconPickerExpand?.()}
                        aria-expanded="false"
                        aria-controls="icon-picker-more"
                      >
                        Parādīt visas
                      </button>
                      <span className="icon-picker-more-hint">
                        vēl {FA_ICONS_MORE.length}
                      </span>
                    </div>
                    <div
                       className="icon-picker-row icon-picker-row--more hidden"
                       id="icon-picker-more"
                       role="group"
                       aria-label="Papildu ikonas"
                     >
                      {FA_ICONS_MORE.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          className="icon-opt"
                          data-icon={ic}
                        >
                          <i className={ic} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="form-group">
              <label>Krāsa</label>
              <div className="color-picker-row" id="color-picker">
                {FS_COLOR_DOTS.map((c) => (
                  <div
                    key={c}
                    className="color-dot"
                    style={{ background: c }}
                    data-color={c}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sub-note">Piezīme (neobligāti)</label>
              <input
                type="text"
                id="sub-note"
                placeholder="piem. Ģimenes plāns"
              />
            </div>

            <div className="modal-advanced" id="modal-advanced">
              <button
                type="button"
                className="modal-advanced-toggle"
                id="modal-advanced-toggle"
                onClick={() => window.toggleModalAdvanced?.()}
                aria-expanded="false"
                aria-controls="modal-advanced-panel"
              >
                <span>Papildu opcijas</span>
                <i
                  className="fa-solid fa-chevron-down modal-advanced-chevron"
                  aria-hidden="true"
                />
              </button>
              <div
                className="modal-advanced-panel hidden"
                id="modal-advanced-panel"
              >
                <p className="form-section-label">
                  Kredīts / atmaksas termiņš{" "}
                  <span className="form-optional">(neobligāti)</span>
                </p>
                <p className="form-hint form-hint--tight">
                  Norādot sākumu un beigas, sarakstā parādīsies progress josla līdz
                  termiņa beigām (piemēram, ātrais kredīts).
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sub-term-start">Termiņš no</label>
                    <input type="date" id="sub-term-start" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sub-term-end">Termiņš līdz</label>
                    <input type="date" id="sub-term-end" />
                  </div>
                </div>

                <p className="form-section-label form-section-label--spaced">
                  Papildu pozīcijas ar termiņu{" "}
                  <span className="form-optional">(neobligāti)</span>
                </p>
                <p className="form-hint form-hint--tight">
                  Piemēram, viedpulkstenis, modēms, iekārtas apdrošināšana vai
                  cits papildu abonements - katrai savs termiņš un papildu summa
                  mēnesī (kopējā maksa saskaita demo režīmā).
                </p>
                <div id="sub-devices-container" className="sub-devices-container" />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm modal-device-add"
                  onClick={() => window.addDeviceRow?.()}
                >
                  <i className="fa-solid fa-plus" /> Pievienot pozīciju
                </button>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => window.closeModal?.()}
            >
              Atcelt
            </button>
            <button
              type="button"
              className="btn btn-primary"
              id="modal-save-btn"
              onClick={() => window.saveSubscription?.()}
            >
              Saglabāt
            </button>
          </div>
        </div>
      </div>

      <div
        className="modal-overlay"
        id="delete-overlay"
        onClick={(e) => window.handleDeleteOverlayClick?.(e.nativeEvent)}
      >
        <div className="modal delete-modal">
          <div className="modal-body">
            <div className="delete-icon">
              <i className="fa-solid fa-trash-can" />
            </div>
            <h3>Dzēst abonementu?</h3>
            <p id="delete-confirm-name">
              Vai tiešām vēlaties dzēst šo abonementu? Šo darbību nevar atcelt.
            </p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => window.closeDeleteModal?.()}
            >
              Atcelt
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => window.confirmDelete?.()}
            >
              Dzēst
            </button>
          </div>
        </div>
      </div>

      <div className="toast-container" id="toast-container" />

      <FsScripts srcs={DASH_SCRIPTS} />
    </>
  );
}

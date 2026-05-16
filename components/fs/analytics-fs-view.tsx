"use client";

import { NavDash } from "@/components/nav-dash";
import { FsScripts } from "@/components/fs/load-fs-scripts";

const ANALYTICS_SCRIPTS = [
  "/fs/js/subscriptions-data.js",
  "/fs/js/subscriptions-helpers.js",
  "/fs/js/dash-notifications.js",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-datalabels/2.2.0/chartjs-plugin-datalabels.min.js",
  "/fs/js/analytics.js",
] as const;

export function AnalyticsFsView() {
  const year = new Date().getFullYear();

  return (
    <>
      <div className="app-layout app-layout-stacked">
        <NavDash active="analytics" />
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Analītika</h1>
              <p className="page-subtitle">
                Kopsavilkums un izdevumi pēc kategorijas (demo dati)
              </p>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="stat-card analytics-card">
              <div className="stat-label">Kopējā mēneša summa</div>
              <div className="stat-value" id="analytics-monthly-total">
                €0.00
              </div>
              <div className="stat-note">visi aktīvie ieraksti</div>
            </div>
            <div className="stat-card analytics-card">
              <div className="stat-label">Aptuvenais gada apjoms</div>
              <div className="stat-value" id="analytics-yearly-total">
                €0.00
              </div>
              <div className="stat-note">12 × mēneša kopsumma</div>
            </div>
            <div className="stat-card analytics-card">
              <div className="stat-label">Nākamais maksājums</div>
              <div className="analytics-next-row">
                <div>
                  <div
                    className="stat-value stat-value--next"
                    id="analytics-next-date"
                  >
                    -
                  </div>
                  <div className="analytics-next-name" id="analytics-next-name">
                    -
                  </div>
                </div>
                <div
                  className="analytics-next-amount"
                  id="analytics-next-amount"
                />
              </div>
            </div>
            <div className="stat-card analytics-card">
              <div className="stat-label">Gaidāmie 30 dienās</div>
              <div className="stat-value" id="analytics-upcoming-total">
                €0.00
              </div>
              <div className="stat-note" id="analytics-upcoming-note">
                -
              </div>
            </div>
            <div className="stat-card analytics-card analytics-card--cat-list">
              <div className="stat-label">Izdevumi pēc kategorijas</div>
              <p className="analytics-cat-hint">
                Mēneša ekvivalenti (ieskaitot papildu pozīcijas)
              </p>
              <div id="analytics-by-category" className="analytics-by-category" />
            </div>
            <div className="stat-card analytics-card analytics-card--cat-chart">
              <div className="stat-label">Sadalījums pa kategorijām</div>
              <p className="analytics-cat-hint analytics-cat-hint--muted">
                Vizuāls kopsavilkums (tie paši dati)
              </p>
              <div className="analytics-pie-wrap" id="analytics-pie-wrap">
                <canvas
                  id="analytics-category-pie"
                  aria-label="Izdevumu sadalījums pa kategorijām"
                />
              </div>
              <p className="analytics-pie-empty hidden" id="analytics-pie-empty">
                Nav datu diagrammai.
              </p>
            </div>
          </div>
        </main>

        <footer className="landing-footer">
          <p>
            &copy; {year} SubTrack. Visi tiesības aizsargātas.
          </p>
        </footer>
      </div>

      <FsScripts srcs={ANALYTICS_SCRIPTS} />
    </>
  );
}

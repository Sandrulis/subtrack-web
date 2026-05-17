"use client";

import { useEffect } from "react";
import { NavDash } from "@/components/nav-dash";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";
import {
  ensureAuthedNotifyScriptsLoaded,
  loadScriptOnce,
} from "@/components/fs/load-fs-scripts";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

const ANALYTICS_TAIL_SCRIPTS = [
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-datalabels/2.2.0/chartjs-plugin-datalabels.min.js",
  "/fs/js/analytics.js",
] as const;

export function AnalyticsFsView({
  userDisplay,
  initialSubscriptions,
}: {
  userDisplay?: NavUserDisplay | null;
  initialSubscriptions: SubscriptionClient[];
}) {
  const { t } = useSubtrackIntl();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureAuthedNotifyScriptsLoaded();
        if (cancelled) return;
        for (const src of ANALYTICS_TAIL_SCRIPTS) {
          if (cancelled) break;
          await loadScriptOnce(src);
        }
        if (cancelled) return;
        window.fsBootAnalytics?.();
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <script
        id="subtrack-subs-bootstrap-json"
        type="application/json"
        // eslint-disable-next-line react/no-danger -- Supabase JSON bootstrap pirms FS skriptiem
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(initialSubscriptions).replace(/</g, "\\u003c"),
        }}
      />
      <div className="app-layout app-layout-stacked">
        <NavDash active="analytics" userDisplay={userDisplay} />
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">{t("nav.analytics")}</h1>
              <p className="page-subtitle">{t("fs.analytics.page_subtitle")}</p>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="stat-card analytics-card">
              <div className="stat-label">{t("fs.analytics.stat_monthly_total")}</div>
              <div className="stat-value" id="analytics-monthly-total">
                €0.00
              </div>
              <div className="stat-note">{t("fs.analytics.stat_monthly_note")}</div>
            </div>
            <div className="stat-card analytics-card">
              <div className="stat-label">{t("fs.analytics.stat_yearly_estimate")}</div>
              <div className="stat-value" id="analytics-yearly-total">
                €0.00
              </div>
              <div className="stat-note">{t("fs.analytics.stat_yearly_note")}</div>
            </div>
            <div className="stat-card analytics-card">
              <div className="stat-label">{t("fs.analytics.stat_next_payment")}</div>
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
              <div className="stat-label">{t("fs.analytics.stat_upcoming_window")}</div>
              <div className="stat-value" id="analytics-upcoming-total">
                €0.00
              </div>
              <div className="stat-note" id="analytics-upcoming-note">
                -
              </div>
            </div>
            <div className="stat-card analytics-card analytics-card--cat-list">
              <div className="stat-label">{t("fs.analytics.section_by_category")}</div>
              <p className="analytics-cat-hint">{t("fs.analytics.hint_monthly_equivalents")}</p>
              <div id="analytics-by-category" className="analytics-by-category" />
            </div>
            <div className="stat-card analytics-card analytics-card--cat-chart">
              <div className="stat-label">{t("fs.analytics.section_category_split")}</div>
              <p className="analytics-cat-hint analytics-cat-hint--muted">
                {t("fs.analytics.hint_visual_split")}
              </p>
              <div className="analytics-pie-wrap" id="analytics-pie-wrap">
                <canvas
                  id="analytics-category-pie"
                  aria-label={t("fs.analytics.pie_chart_aria")}
                />
              </div>
              <p className="analytics-pie-empty hidden" id="analytics-pie-empty">
                {t("fs.analytics.pie_empty")}
              </p>
            </div>
          </div>
        </main>

        <footer className="landing-footer">
          <SiteStandardCopyrightNotice />
        </footer>
      </div>
    </>
  );
}

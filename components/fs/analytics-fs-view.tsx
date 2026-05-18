"use client";

import { useEffect } from "react";
import { NavDash } from "@/components/nav-dash";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import {
  ensureAuthedNotifyScriptsLoaded,
  loadScriptOnce,
} from "@/components/fs/load-fs-scripts";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

const ANALYTICS_TAIL_SCRIPTS = ["/fs/js/analytics.js"] as const;

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
      <template
        id="subtrack-subs-bootstrap-json"
        // eslint-disable-next-line react/no-danger -- FS JSON bootstrap pirms skriptiem (skat. FsI18nBootstrap)
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
              <div id="analytics-by-category" className="analytics-by-category" />
            </div>
            <div className="stat-card analytics-card analytics-card--cat-chart">
              <div className="stat-label">{t("fs.analytics.section_category_split")}</div>
              <div className="analytics-pie-wrap" id="analytics-pie-wrap">
                <div id="analytics-category-donut-root" />
              </div>
              <p className="analytics-pie-empty hidden" id="analytics-pie-empty">
                {t("fs.analytics.pie_empty")}
              </p>
            </div>
          </div>
        </main>

        <SiteLandingFooter />
      </div>
    </>
  );
}

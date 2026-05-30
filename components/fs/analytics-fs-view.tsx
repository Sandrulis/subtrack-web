"use client";

import { useEffect } from "react";
import { NavDash } from "@/components/nav-dash";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import { loadAnalyticsPageScripts } from "@/components/fs/load-fs-scripts";
import type { NavBrandSnapshot } from "@/lib/brand/nav-brand-snapshot";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";
import {
  isProFeaturePreviewLocked,
  type DashboardFreeTierGatePayload,
} from "@/lib/subscriptions/dashboard-free-tier-gate-payload";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { ProTrialProgress } from "@/lib/auth/pro-trial-access";
import { ProTrialProgressBlock } from "@/components/pro-trial/pro-trial-chrome";
import { ProFeaturePreviewCtaCard } from "@/components/pro-feature-preview-gate";
import {
  AppPageContentGate,
  dispatchSubtrackPageContentReady,
  useFsPageContentReady,
} from "@/components/app/app-page-content-gate";

export function AnalyticsFsView({
  brand = null,
  userDisplay,
  initialSubscriptions,
  freeTierGate,
}: {
  brand?: NavBrandSnapshot | null;
  userDisplay?: NavUserDisplay | null;
  initialSubscriptions: SubscriptionClient[];
  freeTierGate: DashboardFreeTierGatePayload;
}) {
  const { t } = useSubtrackIntl();
  const trialProgress: ProTrialProgress | null = userDisplay?.proTrialProgress ?? null;
  const analyticsPreviewLocked = isProFeaturePreviewLocked(freeTierGate);
  const contentReady = useFsPageContentReady();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadAnalyticsPageScripts();
        if (cancelled) return;
        window.fsBootAnalytics?.();
      } catch {
        dispatchSubtrackPageContentReady();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="app-layout app-layout-stacked">
        <NavDash active="analytics" userDisplay={userDisplay} brand={brand} />
        <main className="main-content">
          {trialProgress ? (
            <ProTrialProgressBlock progress={trialProgress} fullWidth />
          ) : null}
          <div className="page-header">
            <div className="page-header-title-stack">
              <h1 className="page-title">{t("nav.analytics")}</h1>
              <p className="page-subtitle">{t("fs.analytics.page_subtitle")}</p>
            </div>
          </div>

          <AppPageContentGate ready={contentReady} className="app-page-content-gate--main">
          <div
            className={
              "analytics-preview-wrap" +
              (analyticsPreviewLocked ? " analytics-preview-wrap--locked" : "")
            }
          >
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
          {analyticsPreviewLocked ? (
            <div
              className="analytics-preview-overlay"
              role="region"
              aria-label={t("subscribe.benefit.analytics.title")}
            >
              <ProFeaturePreviewCtaCard feature="analytics" />
            </div>
          ) : null}
          </div>
          </AppPageContentGate>
        </main>

        <SiteLandingFooter showAuthedActionLinks={Boolean(userDisplay)} />
      </div>
    </>
  );
}

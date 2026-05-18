"use client";

import Link from "next/link";
import { DemoTopbar } from "@/components/demo/demo-topbar";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import type { DemoAnalyticsSnapshot } from "@/lib/demo/build-demo-analytics-snapshot";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type DonutSeg = DemoAnalyticsSnapshot["pieRows"][number];

function DemoCategoryDonut({
  segments,
  t,
}: {
  segments: DonutSeg[];
  t: (k: string) => string;
}) {
  const total = segments.reduce((s, x) => s + x.amount, 0);
  let angle = 0;
  const conicParts = segments.map((seg) => {
    const frac = total > 0 ? seg.amount / total : 0;
    const deg = frac * 360;
    const from = angle;
    angle += deg;
    return `${seg.color} ${from}deg ${angle}deg`;
  });
  const conic =
    total > 0 ? `conic-gradient(${conicParts.join(", ")})` : "#e2e8f0";

  return (
    <div className="demo-analytics-donut-wrap">
      <div className="demo-donut-ring-shell" aria-hidden="true">
        <div className="demo-donut-ring" style={{ background: conic }} />
        <div className="demo-donut-hole" />
      </div>
      <ul className="demo-analytics-donut-legend">
        {segments.map((seg) => (
          <li key={seg.categoryPhraseKey}>
            <span
              className="demo-analytics-dot"
              style={{ background: seg.color }}
              aria-hidden="true"
            />
            <span className="demo-analytics-cat-name">
              {t(seg.categoryPhraseKey)}
            </span>
            <span className="demo-analytics-cat-amt">
              €{seg.amount.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DemoAnalyticsPage({
  userDisplay,
  analyticsSnapshot,
}: {
  userDisplay?: NavUserDisplay | null;
  analyticsSnapshot: DemoAnalyticsSnapshot;
}) {
  const { t } = useSubtrackIntl();
  const snap = analyticsSnapshot;
  const pieRows = snap.pieRows;
  const pieTotal = pieRows.reduce((s, x) => s + x.amount, 0);

  const upcomingNoteRaw = t("fs.analytics.upcoming_note");
  const upcomingNote =
    upcomingNoteRaw.includes("{count}") && snap.upcomingCount >= 0
      ? upcomingNoteRaw.replace(/\{count\}/g, String(snap.upcomingCount))
      : t("demo.analytics.upcoming_note_sample");

  const next = snap.nextPayment;

  return (
    <div className="app-layout app-layout-stacked">
      <DemoTopbar active="analytics" userDisplay={userDisplay} />
      <div className="subtrack-demo-banner" role="status">
        <div className="subtrack-demo-banner-inner">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          <p>{t("demo.banner")}</p>
          <Link href="/signup" className="btn btn-primary btn-sm subtrack-demo-banner-cta">
            {t("landing.hero.cta_signup")}
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <main className="main-content demo-main">
        <div className="page-header">
          <div>
            <div className="demo-analytics-heading-row">
              <h1 className="page-title">{t("nav.analytics")}</h1>
              <span
                className="subtrack-demo-topbar-badge"
                title={t("demo.banner")}
              >
                {t("demo.nav.badge")}
              </span>
            </div>
            <p className="page-subtitle">{t("fs.analytics.page_subtitle")}</p>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="stat-card analytics-card">
            <div className="stat-label">{t("fs.analytics.stat_monthly_total")}</div>
            <div className="stat-value">€{snap.monthlyTotal.toFixed(2)}</div>
            <div className="stat-note">{t("fs.analytics.stat_monthly_note")}</div>
          </div>
          <div className="stat-card analytics-card">
            <div className="stat-label">{t("fs.analytics.stat_yearly_estimate")}</div>
            <div className="stat-value">€{snap.yearlyEstimate.toFixed(2)}</div>
            <div className="stat-note">{t("fs.analytics.stat_yearly_note")}</div>
          </div>
          <div className="stat-card analytics-card">
            <div className="stat-label">{t("fs.analytics.stat_next_payment")}</div>
            <div className="analytics-next-row">
              <div>
                <div className="stat-value stat-value--next">
                  {next ? next.dateLabel : "-"}
                </div>
                <div className="analytics-next-name">
                  {next ? next.name : t("fs.analytics.next_none")}
                </div>
              </div>
              <div className="analytics-next-amount">
                {next ? `€${next.amount.toFixed(2)}` : ""}
              </div>
            </div>
          </div>
          <div className="stat-card analytics-card">
            <div className="stat-label">{t("fs.analytics.stat_upcoming_window")}</div>
            <div className="stat-value">€{snap.upcomingWindowTotal.toFixed(2)}</div>
            <div className="stat-note">{upcomingNote}</div>
          </div>

          <div className="stat-card analytics-card analytics-card--cat-list">
            <div className="stat-label">{t("fs.analytics.section_by_category")}</div>
            <div className="analytics-by-category">
              {pieRows.map((row) => {
                const pct =
                  pieTotal > 0 ? Math.round((row.amount / pieTotal) * 100) : 0;
                return (
                  <div key={row.categoryPhraseKey} className="analytics-cat-row">
                    <div className="analytics-cat-label">
                      <span className="analytics-cat-name">
                        {t(row.categoryPhraseKey)}
                      </span>
                      <span className="analytics-cat-amount">
                        €{row.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="analytics-cat-bar">
                      <div
                        className="analytics-cat-bar-fill"
                        style={{ width: `${pct}%`, background: row.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="stat-card analytics-card analytics-card--cat-chart">
            <div className="stat-label">{t("fs.analytics.section_category_split")}</div>
            <DemoCategoryDonut segments={pieRows} t={t} />
          </div>
        </div>
      </main>
      <footer className="landing-footer">
        <SiteStandardCopyrightNotice />
      </footer>
    </div>
  );
}

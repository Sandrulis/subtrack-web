"use client";

import { DashBrandLink } from "@/components/brand/dash-brand-link";
import Link from "next/link";
import type { NavBrandSnapshot } from "@/lib/brand/nav-brand-snapshot";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { AuthedNotifyBootstrap } from "@/components/authed-notify-bootstrap";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NavSessionActions } from "@/components/nav-session-actions";

export type NavDashActive = "dashboard" | "analytics" | "admin" | "";

type NavDashProps = {
  active?: NavDashActive;
  /** Ja nav (neliels SSR robežgadījums), rāda īsu rezerves tekstu. */
  userDisplay?: NavUserDisplay | null;
  /**
   * `/demo/*` maršruti: paneļa un analītikas saites paliek demonstrācijā
   * un mobilā josla izmanto `mode="demo"`.
   */
  demoMode?: boolean;
  /** Pārlasīt `#subtrack-subs-bootstrap-json` pēc skriptiem (lapas bez dashboard, piem. family-sharing). */
  reloadSubscriptionsFromBootstrap?: boolean;
  /** Zīmols no servera lapas (vienāda hydrācija). */
  brand?: NavBrandSnapshot | null;
};

export function NavDash({
  active = "",
  userDisplay,
  demoMode = false,
  reloadSubscriptionsFromBootstrap = false,
  brand = null,
}: NavDashProps) {
  const { t } = useSubtrackIntl();
  const analyticsHref = demoMode ? "/demo/analytics" : "/analytics";
  const dashboardHref = demoMode ? "/demo/dashboard" : "/dashboard";
  const showAnalyticsNav = true;

  return (
    <>
    <AuthedNotifyBootstrap
      enabled={Boolean(userDisplay) || demoMode}
      reloadSubscriptionsFromBootstrap={
        demoMode || reloadSubscriptionsFromBootstrap
      }
    />
    <header className="dash-topbar">
      <div className="dash-topbar-shell">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <DashBrandLink href={dashboardHref} brand={brand} />
            {demoMode ? (
              <span
                className="subtrack-demo-topbar-badge"
                title={t("demo.banner")}
              >
                {t("demo.nav.badge")}
              </span>
            ) : null}
            <span className="dash-topbar-rule" aria-hidden="true" />
            <nav className="dash-nav-links" aria-label={t("nav.primary")}>
              <Link
                href={dashboardHref}
                className={
                  "dash-nav-link" + (active === "dashboard" ? " is-active" : "")
                }
                aria-label={t("nav.dashboard")}
                aria-current={active === "dashboard" ? "page" : undefined}
              >
                <svg
                  className="dash-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    fill="currentColor"
                    d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
                  />
                </svg>
                <span className="dash-nav-link-text">{t("nav.dashboard")}</span>
              </Link>
              {showAnalyticsNav ? (
                <Link
                  href={analyticsHref}
                  className={
                    "dash-nav-link" + (active === "analytics" ? " is-active" : "")
                  }
                  aria-label={t("nav.analytics")}
                  aria-current={active === "analytics" ? "page" : undefined}
                >
                  <svg
                    className="dash-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v8h8c0 4.41-3.59 8-8 8z"
                    />
                  </svg>
                  <span className="dash-nav-link-text">{t("nav.analytics")}</span>
                </Link>
              ) : null}
              {userDisplay?.isAdmin ? (
                <Link
                  href="/admin"
                  prefetch={false}
                  className={
                    "dash-nav-link" + (active === "admin" ? " is-active" : "")
                  }
                  aria-label={t("nav.admin")}
                  aria-current={active === "admin" ? "page" : undefined}
                >
                  <svg
                    className="dash-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
                    />
                  </svg>
                  <span className="dash-nav-link-text">{t("nav.admin")}</span>
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="dash-topbar-right">
            <NavSessionActions userDisplay={userDisplay} />
          </div>
        </div>
      </div>
    </header>
    <MobileBottomNav
      mode={demoMode ? "demo" : "authed"}
      isAdmin={Boolean(userDisplay?.isAdmin)}
      showAnalytics={showAnalyticsNav}
      analyticsHref={analyticsHref}
    />
    </>
  );
}

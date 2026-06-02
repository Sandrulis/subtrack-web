"use client";

import { DashBrandLink } from "@/components/brand/dash-brand-link";
import Link from "next/link";
import { AuthedNotifyBootstrap } from "@/components/authed-notify-bootstrap";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { DashNotifyDropdown } from "@/components/dash-notify-dropdown";
import { NavUiLanguageSwitcher } from "@/components/nav-ui-language-switcher";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NavSessionActions } from "@/components/nav-session-actions";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

export function DemoTopbar({
  active,
  userDisplay,
}: {
  active: "dashboard" | "analytics";
  userDisplay?: NavUserDisplay | null;
}) {
  const { t, signupEnabled } = useSubtrackIntl();

  return (
    <>
      <AuthedNotifyBootstrap enabled reloadSubscriptionsFromBootstrap />
      <header className="dash-topbar">
        <div className="dash-topbar-shell">
          <div className="dash-topbar-inner">
            <div className="dash-topbar-left">
              <DashBrandLink href="/" />
              <span
                className="subtrack-demo-topbar-badge"
                title={t("demo.banner")}
              >
                {t("demo.nav.badge")}
              </span>
              <span className="dash-topbar-rule" aria-hidden="true" />
              <nav className="dash-nav-links" aria-label={t("demo.nav.aria")}>
                <Link
                  href="/demo/dashboard"
                  className={
                    "dash-nav-link" +
                    (active === "dashboard" ? " is-active" : "")
                  }
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
                <Link
                  href="/demo/analytics"
                  className={
                    "dash-nav-link" +
                    (active === "analytics" ? " is-active" : "")
                  }
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
              </nav>
            </div>
            <div className="dash-topbar-right">
              {userDisplay ? (
                <NavSessionActions
                  userDisplay={userDisplay}
                  showDashboardInUserMenu
                />
              ) : (
                <div className="dash-actions">
                  <NavUiLanguageSwitcher layout="topbar" />
                  <DashNotifyDropdown />
                  <span
                    className="dash-topbar-rule dash-topbar-rule--actions"
                    aria-hidden="true"
                  />
                  <Link href="/login" className="dash-nav-link">
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
                        d="M11 7L9.41 8.59 11 10H5v4h6l-1.59 1.59L11 17l5-5-5-5zm8 14h-8v-2h8V6h-8V4h8a2 2 0 012 2v12a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="dash-nav-link-text">{t("nav.login")}</span>
                  </Link>
                  {signupEnabled ? (
                    <Link
                      href="/signup"
                      className="dash-nav-link dash-nav-link--cta"
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
                          d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3V9H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                        />
                      </svg>
                      <span className="dash-nav-link-text">{t("nav.signup")}</span>
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <MobileBottomNav
        mode="demo"
        isAdmin={userDisplay?.isAdmin === true}
        showAnalytics
      />
    </>
  );
}

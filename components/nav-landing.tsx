"use client";

import { NavUiLanguageSwitcher } from "@/components/nav-ui-language-switcher";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { canAccessAnalytics } from "@/lib/subscriptions/analytics-access";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { AuthedNotifyBootstrap } from "@/components/authed-notify-bootstrap";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NavSessionActions } from "@/components/nav-session-actions";

export type NavLandingActive = "" | "login" | "signup";

type NavLandingProps = {
  active?: NavLandingActive;
  /** Ja ir sesija (sākumlapa), rāda paneļa tipa darbības nevis Ieiet / Reģistrēties. */
  userDisplay?: NavUserDisplay | null;
};

export function NavLanding({ active = "", userDisplay }: NavLandingProps) {
  const { t, systemSiteName, paidPlan } = useSubtrackIntl();
  const pathname = usePathname() ?? "";
  const showAuthedAnalytics =
    Boolean(userDisplay) && canAccessAnalytics(paidPlan, userDisplay);
  const authedAnalyticsPathActive = pathname.startsWith("/analytics");
  return (
    <>
    <AuthedNotifyBootstrap enabled={Boolean(userDisplay)} />
    <header className="dash-topbar">
      <div className="dash-topbar-shell">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <Link
              href={userDisplay ? "/dashboard" : "/"}
              className="dash-brand"
            >
              <span className="dash-brand-text">{systemSiteName}</span>
            </Link>
            <span className="dash-topbar-rule" aria-hidden="true" />
            <nav
              className="dash-nav-links"
              aria-label={
                userDisplay ? t("nav.primary") : t("nav.primary_landing")
              }
            >
              {userDisplay ? (
                <>
                  <Link href="/dashboard" className="dash-nav-link">
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
                  {showAuthedAnalytics ? (
                    <Link
                      href="/analytics"
                      className={
                        "dash-nav-link" +
                        (authedAnalyticsPathActive ? " is-active" : "")
                      }
                      aria-current={
                        authedAnalyticsPathActive ? "page" : undefined
                      }
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
                      <span className="dash-nav-link-text">
                        {t("nav.analytics")}
                      </span>
                    </Link>
                  ) : null}
                  {userDisplay.isAdmin ? (
                    <Link href="/admin" prefetch={false} className="dash-nav-link">
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
                      <span className="dash-nav-link-text">
                        {t("nav.admin")}
                      </span>
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <Link
                    href="/#features"
                    className="dash-nav-link"
                    data-landing-anchor="features"
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
                        d="M4 11h7V4H4v7zm0 9h7v-7H4v7zm9 0h7v-7h-7v7zm0-11h7V4h-7v7z"
                      />
                    </svg>
                    <span className="dash-nav-link-text">{t("nav.features")}</span>
                  </Link>
                  <Link
                    href="/#demo"
                    className="dash-nav-link"
                    data-landing-anchor="demo"
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
                    <span className="dash-nav-link-text">{t("nav.demo")}</span>
                  </Link>
                  <Link
                    href="/#faq"
                    className="dash-nav-link"
                    data-landing-anchor="faq"
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
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v2z"
                      />
                    </svg>
                    <span className="dash-nav-link-text">{t("nav.faq_nav")}</span>
                  </Link>
                </>
              )}
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
                <Link
                  href="/login"
                  className={
                    "dash-nav-link" + (active === "login" ? " is-active" : "")
                  }
                  aria-current={active === "login" ? "page" : undefined}
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
                      d="M11 7L9.41 8.59 11 10H5v4h6l-1.59 1.59L11 17l5-5-5-5zm8 14h-8v-2h8V6h-8V4h8a2 2 0 012 2v12a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="dash-nav-link-text">{t("nav.login")}</span>
                </Link>
                <Link
                  href="/signup"
                  className={
                    "dash-nav-link dash-nav-link--cta" +
                    (active === "signup" ? " is-active" : "")
                  }
                  aria-current={active === "signup" ? "page" : undefined}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    <MobileBottomNav
      mode={userDisplay ? "authed" : "guest"}
      isAdmin={Boolean(userDisplay?.isAdmin)}
      showAnalytics={showAuthedAnalytics}
      analyticsHref="/analytics"
    />
    </>
  );
}

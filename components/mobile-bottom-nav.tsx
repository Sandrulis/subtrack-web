"use client";

import { MobileBottomNavItem } from "@/components/mobile-bottom-nav-item";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type MobileBottomNavProps = {
  mode: "guest" | "authed" | "demo";
  isAdmin?: boolean;
  /** Ja false, analītikas saite netiek rādīta (ielogotiem – atstāj true un lieto `analyticsHref`). */
  showAnalytics?: boolean;
  /** Ielogotajiem: maršruts uz analītiku (`/analytics` vai `/demo/analytics`). */
  analyticsHref?: string;
};

type DashKey = "dashboard" | "analytics" | "admin";

function authedSegment(pathname: string): DashKey | "" {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/demo/analytics")) return "analytics";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  return "";
}

function demoSegment(pathname: string): "dashboard" | "analytics" | "" {
  if (pathname.startsWith("/demo/dashboard")) return "dashboard";
  if (pathname.startsWith("/demo/analytics")) return "analytics";
  return "";
}

const iconDashboard = (
  <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
    />
  </svg>
);

const iconAnalytics = (
  <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v8h8c0 4.41-3.59 8-8 8z"
    />
  </svg>
);

const iconAdmin = (
  <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
    />
  </svg>
);

const iconHome = (
  <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
    <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
  </svg>
);

const iconFeatures = (
  <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M4 11h7V4H4v7zm0 9h7v-7H4v7zm9 0h7v-7h-7v7zm0-11h7V4h-7v7z"
    />
  </svg>
);

const iconFaq = (
  <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v2z"
    />
  </svg>
);

/**
 * Portāls uz document.body, lai position:fixed vienmēr balstītos pret viewport
 * (citādi dažos izkārtojumos / pārlūkos elements „pārvietojas” kopā ar vecāku).
 */
export function MobileBottomNav({
  mode,
  isAdmin = false,
  showAnalytics = true,
  analyticsHref = "/analytics",
}: MobileBottomNavProps) {
  const { t } = useSubtrackIntl();
  const pathname = usePathname() ?? "";
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const authedSegmentKey = useMemo(
    () => (mode === "authed" ? authedSegment(pathname) : ""),
    [mode, pathname],
  );

  const demoSegmentKey = useMemo(
    () => (mode === "demo" ? demoSegment(pathname) : ""),
    [mode, pathname],
  );

  useLayoutEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const nav =
    mode === "demo" ? (
      <nav className="mobile-bottom-nav" aria-label={t("demo.nav.aria")}>
        <div className="mobile-bottom-nav-pill">
          <MobileBottomNavItem
            href="/demo/dashboard"
            label={t("nav.dashboard")}
            active={demoSegmentKey === "dashboard"}
            icon={iconDashboard}
          />
          <MobileBottomNavItem
            href="/demo/analytics"
            label={t("nav.analytics")}
            active={demoSegmentKey === "analytics"}
            icon={iconAnalytics}
          />
          {isAdmin ? (
            <MobileBottomNavItem
              href="/admin"
              prefetch={false}
              label={t("nav.admin")}
              icon={iconAdmin}
            />
          ) : (
            <MobileBottomNavItem
              href="/"
              label={t("mobile.nav.home")}
              icon={iconHome}
            />
          )}
        </div>
      </nav>
    ) : mode === "guest" ? (
      <nav
        className="mobile-bottom-nav"
        aria-label={t("mobile.nav.guest_sections")}
      >
        <div className="mobile-bottom-nav-pill">
          <MobileBottomNavItem
            href="/#features"
            label={t("nav.features")}
            icon={iconFeatures}
            data-landing-anchor="features"
          />
          <MobileBottomNavItem
            href="/#demo"
            label={t("nav.demo")}
            icon={iconAnalytics}
            data-landing-anchor="demo"
          />
          <MobileBottomNavItem
            href="/#faq"
            label={t("nav.faq_nav")}
            icon={iconFaq}
            data-landing-anchor="faq"
          />
        </div>
      </nav>
    ) : (
      <nav className="mobile-bottom-nav" aria-label={t("mobile.nav.authed_primary")}>
        <div className="mobile-bottom-nav-pill">
          <MobileBottomNavItem
            href="/dashboard"
            label={t("nav.dashboard")}
            active={authedSegmentKey === "dashboard"}
            icon={iconDashboard}
          />
          {showAnalytics ? (
            <MobileBottomNavItem
              href={analyticsHref}
              label={t("nav.analytics")}
              active={authedSegmentKey === "analytics"}
              className={
                analyticsHref.startsWith("/demo/")
                  ? "mobile-bottom-nav-link--analytics-demo"
                  : ""
              }
              icon={iconAnalytics}
            />
          ) : null}
          {isAdmin ? (
            <MobileBottomNavItem
              href="/admin"
              prefetch={false}
              label={t("nav.admin")}
              active={authedSegmentKey === "admin"}
              icon={iconAdmin}
            />
          ) : null}
        </div>
      </nav>
    );

  if (!portalTarget) return null;
  return createPortal(nav, portalTarget);
}

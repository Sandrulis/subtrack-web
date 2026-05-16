"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type MobileBottomNavProps = {
  mode: "guest" | "authed";
  isAdmin?: boolean;
};

type DashKey = "dashboard" | "analytics" | "admin";

function authedSegment(pathname: string): DashKey | "" {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  return "";
}

/**
 * Portāls uz document.body, lai position:fixed vienmēr balstītos pret viewport
 * (citādi dažos izkārtojumos / pārlūkos elements „pārvietojas” kopā ar vecāku).
 */
export function MobileBottomNav({
  mode,
  isAdmin = false,
}: MobileBottomNavProps) {
  const pathname = usePathname() ?? "";
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const authedSegmentKey = useMemo(
    () => (mode === "authed" ? authedSegment(pathname) : ""),
    [mode, pathname],
  );

  useLayoutEffect(() => {
    queueMicrotask(() => setPortalTarget(document.body));
  }, []);

  const nav =
    mode === "guest" ? (
      <nav
        className="mobile-bottom-nav"
        aria-label="Sākumlapas sadaļas"
      >
        <div className="mobile-bottom-nav-pill">
          <Link
            href="/#features"
            className="mobile-bottom-nav-link"
            data-landing-anchor="features"
            aria-label="Iespējas"
          >
            <span className="mobile-bottom-nav-icon-slot" aria-hidden="true">
              <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M4 11h7V4H4v7zm0 9h7v-7H4v7zm9 0h7v-7h-7v7zm0-11h7V4h-7v7z"
                />
              </svg>
            </span>
          </Link>
          <Link
            href="/#demo"
            className="mobile-bottom-nav-link"
            data-landing-anchor="demo"
            aria-label="Demonstrācija"
          >
            <span className="mobile-bottom-nav-icon-slot" aria-hidden="true">
              <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v8h8c0 4.41-3.59 8-8 8z"
                />
              </svg>
            </span>
          </Link>
          <Link
            href="/#faq"
            className="mobile-bottom-nav-link"
            data-landing-anchor="faq"
            aria-label="FAQ"
          >
            <span className="mobile-bottom-nav-icon-slot" aria-hidden="true">
              <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v2z"
                />
              </svg>
            </span>
          </Link>
        </div>
      </nav>
    ) : (
      <nav className="mobile-bottom-nav" aria-label="Galvenā navigācija">
        <div className="mobile-bottom-nav-pill">
          <Link
            href="/dashboard"
            className={
              "mobile-bottom-nav-link" +
              (authedSegmentKey === "dashboard" ? " is-route-active" : "")
            }
            aria-current={
              authedSegmentKey === "dashboard" ? "page" : undefined
            }
            aria-label="Panelis"
          >
            <span className="mobile-bottom-nav-icon-slot" aria-hidden="true">
              <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
                />
              </svg>
            </span>
          </Link>
          <Link
            href="/analytics"
            className={
              "mobile-bottom-nav-link" +
              (authedSegmentKey === "analytics" ? " is-route-active" : "")
            }
            aria-current={
              authedSegmentKey === "analytics" ? "page" : undefined
            }
            aria-label="Analītika"
          >
            <span className="mobile-bottom-nav-icon-slot" aria-hidden="true">
              <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v8h8c0 4.41-3.59 8-8 8z"
                />
              </svg>
            </span>
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className={
                "mobile-bottom-nav-link" +
                (authedSegmentKey === "admin" ? " is-route-active" : "")
              }
              aria-current={
                authedSegmentKey === "admin" ? "page" : undefined
              }
              aria-label="Administrācija"
            >
              <span className="mobile-bottom-nav-icon-slot" aria-hidden="true">
                <svg className="mobile-bottom-nav-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
                  />
                </svg>
              </span>
            </Link>
          ) : null}
        </div>
      </nav>
    );

  if (!portalTarget) return null;
  return createPortal(nav, portalTarget);
}

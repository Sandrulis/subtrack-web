"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { SiteBrandLogo } from "@/components/brand/site-brand-logo";
import { OfflineWifiIcon } from "@/components/pwa/offline-wifi-icon";

export function OfflinePageView() {
  const { t, brandLogo } = useSubtrackIntl();
  const hasLogo = Boolean(brandLogo?.topbar);

  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    const onOnline = () => window.location.reload();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return (
    <div className="offline-page">
      <div className="offline-page-bg" aria-hidden="true">
        <span className="offline-page-orb offline-page-orb--1" />
        <span className="offline-page-orb offline-page-orb--2" />
      </div>

      <div className="offline-page-inner">
        <div
          className={"offline-card" + (hasLogo ? "" : " offline-card--no-brand")}
          role="status"
        >
          {hasLogo ? (
            <div className="offline-brand">
              <SiteBrandLogo size={48} className="offline-brand-logo" />
            </div>
          ) : null}

          <div className="offline-icon-wrap">
            <OfflineWifiIcon />
          </div>

          <p className="offline-status" aria-hidden="true">
            <span className="offline-badge-dot" />
          </p>

          <h1 className="offline-title">{t("pwa.offline.title")}</h1>
          <p className="offline-lead">{t("pwa.offline.body")}</p>

          <div className="offline-actions">
            <button type="button" className="btn btn-primary offline-retry-btn" onClick={retry}>
              {t("pwa.offline.retry")}
            </button>
            <Link className="offline-home-link" href="/">
              {t("legal.back_home")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

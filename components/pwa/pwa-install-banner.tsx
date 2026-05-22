"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  isIosSafariInstallable,
  isStandaloneDisplayMode,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/install-prompt";

export function PwaInstallBanner({
  deferredPrompt,
  onDismiss,
  onInstallClick,
}: {
  deferredPrompt: BeforeInstallPromptEvent | null;
  onDismiss: () => void;
  onInstallClick: () => void;
}) {
  const { t, brandLogo, systemSiteName, pwa } = useSubtrackIntl();
  const ios = isIosSafariInstallable();
  const showInstall = Boolean(deferredPrompt);

  return (
    <div className="pwa-install-banner" role="region" aria-label={t("pwa.banner.aria")}>
      <div
        className="pwa-install-banner-inner"
        style={brandLogo ? { backgroundColor: pwa.backgroundColor } : undefined}
      >
        <button
          type="button"
          className="pwa-install-banner-close"
          onClick={onDismiss}
          aria-label={t("pwa.banner.dismiss")}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        <div className="pwa-install-banner-main">
          <div className="pwa-install-banner-icon" aria-hidden="true">
            {brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brandLogo.icon64}
                alt=""
                width={44}
                height={44}
                className="pwa-install-banner-icon-img"
                decoding="async"
              />
            ) : (
              <span className="pwa-install-banner-icon-fallback">
                {systemSiteName.charAt(0).toUpperCase() || "R"}
              </span>
            )}
          </div>

          <div className="pwa-install-banner-copy">
            <p className="pwa-install-banner-title">{t("pwa.banner.title")}</p>
            {ios && !deferredPrompt ? (
              <p className="pwa-install-banner-hint">{t("pwa.banner.ios_hint")}</p>
            ) : (
              <p className="pwa-install-banner-lead">{systemSiteName}</p>
            )}
          </div>
        </div>

        {showInstall ? (
          <button
            type="button"
            className="btn btn-primary btn-sm pwa-install-banner-cta"
            onClick={onInstallClick}
          >
            <i className="fa-solid fa-download" aria-hidden="true" />
            {t("pwa.banner.action")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function shouldShowPwaBanner({
  installBannerEnabled,
  dismissed,
}: {
  installBannerEnabled: boolean;
  dismissed: boolean;
}): boolean {
  if (!installBannerEnabled) return false;
  if (dismissed) return false;
  if (isStandaloneDisplayMode()) return false;
  if (window.matchMedia("(min-width: 961px)").matches) return false;
  return true;
}

export { readPwaBannerDismissed, writePwaBannerDismissed } from "@/lib/pwa/install-banner-dismiss";

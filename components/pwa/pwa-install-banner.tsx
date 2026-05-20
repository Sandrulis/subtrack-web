"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { PWA_INSTALL_DISMISS_KEY } from "@/lib/pwa/defaults";
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
  const { t } = useSubtrackIntl();
  const ios = isIosSafariInstallable();

  return (
    <div className="pwa-install-banner" role="region" aria-label={t("pwa.banner.aria")}>
      <div className="pwa-install-banner-inner">
        <p className="pwa-install-banner-title">{t("pwa.banner.title")}</p>
        {ios && !deferredPrompt ? (
          <p className="pwa-install-banner-hint">{t("pwa.banner.ios_hint")}</p>
        ) : null}
        <div className="pwa-install-banner-actions">
          {deferredPrompt ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={onInstallClick}>
              {t("pwa.banner.action")}
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDismiss}>
            {t("pwa.banner.dismiss")}
          </button>
        </div>
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
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(min-width: 961px)").matches) return false;
  return true;
}

export function readPwaBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === "1";
}

export function writePwaBannerDismissed(): void {
  localStorage.setItem(PWA_INSTALL_DISMISS_KEY, "1");
}

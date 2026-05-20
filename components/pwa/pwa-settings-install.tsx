"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  isIosSafariInstallable,
  isStandaloneDisplayMode,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/install-prompt";
import { useCallback, useEffect, useState } from "react";

export function PwaSettingsInstall() {
  const { t, pwa } = useSubtrackIntl();
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIos(isIosSafariInstallable());
    setStandalone(isStandaloneDisplayMode());
  }, []);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const onInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (!pwa.installSettingsEnabled) return null;
  if (mounted && standalone) return null;

  const showIosHint = mounted && ios && !deferredPrompt;
  const showInstallBtn = mounted && Boolean(deferredPrompt);

  return (
    <section className="settings-pwa-install" aria-labelledby="settings-pwa-install-heading">
      <h2 id="settings-pwa-install-heading" className="settings-section-title">
        {t("pwa.install.section_title")}
      </h2>
      <p className="settings-section-lead">{t("pwa.install.description")}</p>
      {showIosHint ? (
        <p className="settings-pwa-install-hint">{t("pwa.install.ios_hint")}</p>
      ) : null}
      {showInstallBtn ? (
        <button type="button" className="btn btn-primary" onClick={() => void onInstall()}>
          {t("pwa.install.action")}
        </button>
      ) : null}
    </section>
  );
}

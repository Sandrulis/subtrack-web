"use client";

import {
  PwaInstallBanner,
  readPwaBannerDismissed,
  shouldShowPwaBanner,
  writePwaBannerDismissed,
} from "@/components/pwa/pwa-install-banner";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { usePwaDeferredInstall } from "@/components/pwa/pwa-deferred-install-provider";
import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import { PWA_INSTALL_BANNER_PATHS } from "@/lib/pwa/install-prompt-capture";
import { isStandaloneDisplayMode } from "@/lib/pwa/install-prompt";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function PwaInstallHost() {
  const { pwa } = useSubtrackIntl();
  const pathname = usePathname() ?? "";
  const { deferredPrompt, clearDeferredPrompt } = usePwaDeferredInstall();
  const [mounted, setMounted] = useState(false);
  const [dismissVersion, setDismissVersion] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismissed = useMemo(
    () => readPwaBannerDismissed(),
    [dismissVersion],
  );

  const visible =
    mounted &&
    !isNativeCapacitorApp() &&
    PWA_INSTALL_BANNER_PATHS.has(pathname) &&
    shouldShowPwaBanner({
      installBannerEnabled: pwa.installBannerEnabled,
      dismissed,
    });

  const onDismiss = useCallback(() => {
    writePwaBannerDismissed();
    clearDeferredPrompt();
    setDismissVersion((v) => v + 1);
  }, [clearDeferredPrompt]);

  const onInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    clearDeferredPrompt();
    writePwaBannerDismissed();
    setDismissVersion((v) => v + 1);
  }, [deferredPrompt, clearDeferredPrompt]);

  if (!visible || isStandaloneDisplayMode()) return null;

  return (
    <PwaInstallBanner
      deferredPrompt={deferredPrompt}
      onDismiss={onDismiss}
      onInstallClick={() => void onInstallClick()}
    />
  );
}

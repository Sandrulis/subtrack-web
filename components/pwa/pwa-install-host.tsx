"use client";

import {
  PwaInstallBanner,
  readPwaBannerDismissed,
  shouldShowPwaBanner,
  writePwaBannerDismissed,
} from "@/components/pwa/pwa-install-banner";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { BeforeInstallPromptEvent } from "@/lib/pwa/install-prompt";
import { isStandaloneDisplayMode } from "@/lib/pwa/install-prompt";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const BANNER_PATHS = new Set(["/dashboard", "/analytics", "/settings"]);

export function PwaInstallHost() {
  const { pwa } = useSubtrackIntl();
  const pathname = usePathname() ?? "";
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissVersion, setDismissVersion] = useState(0);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismissed = useMemo(
    () => readPwaBannerDismissed(),
    [dismissVersion],
  );

  const visible =
    BANNER_PATHS.has(pathname) &&
    shouldShowPwaBanner({
      installBannerEnabled: pwa.installBannerEnabled,
      dismissed,
    });

  const onDismiss = useCallback(() => {
    writePwaBannerDismissed();
    setDismissVersion((v) => v + 1);
  }, []);

  const onInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    writePwaBannerDismissed();
    setDismissVersion((v) => v + 1);
  }, [deferredPrompt]);

  if (!visible || isStandaloneDisplayMode()) return null;

  return (
    <PwaInstallBanner
      deferredPrompt={deferredPrompt}
      onDismiss={onDismiss}
      onInstallClick={() => void onInstallClick()}
    />
  );
}

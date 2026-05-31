"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import type { BeforeInstallPromptEvent } from "@/lib/pwa/install-prompt";
import { shouldCaptureBeforeInstallPrompt } from "@/lib/pwa/install-prompt-capture";

type PwaDeferredInstallContextValue = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  clearDeferredPrompt: () => void;
};

const PwaDeferredInstallContext = createContext<PwaDeferredInstallContextValue | null>(
  null,
);

export function usePwaDeferredInstall(): PwaDeferredInstallContextValue {
  const ctx = useContext(PwaDeferredInstallContext);
  if (!ctx) {
    throw new Error("usePwaDeferredInstall requires PwaDeferredInstallProvider");
  }
  return ctx;
}

export function PwaDeferredInstallProvider({ children }: { children: React.ReactNode }) {
  const { pwa } = useSubtrackIntl();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  const clearDeferredPrompt = useCallback(() => {
    setDeferredPrompt(null);
  }, []);

  useEffect(() => {
    if (isNativeCapacitorApp()) return;
    if (!pwa.enabled || !pwa.installBannerEnabled) {
      return;
    }

    const onBip = (e: Event) => {
      if (!shouldCaptureBeforeInstallPrompt(pwa)) {
        return;
      }
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, [pwa.enabled, pwa.installBannerEnabled]);

  return (
    <PwaDeferredInstallContext.Provider value={{ deferredPrompt, clearDeferredPrompt }}>
      {children}
    </PwaDeferredInstallContext.Provider>
  );
}

"use client";

import "@/lib/pwa/register-app-badge-bridge";
import { prepareNativeWebShell } from "@/lib/capacitor/prepare-native-web-shell";
import { requestNativeAppPermissions } from "@/lib/capacitor/request-native-permissions";
import { useEffect } from "react";

/** Pirms PWA SW: atslēdz service worker native čaulā, lai Capacitor plugini (Badge) strādātu. */
export function CapacitorNativeShellBootstrap() {
  useEffect(() => {
    void (async () => {
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.show({ autoHide: false });
      } catch {
        /* ignore */
      }
      const result = await prepareNativeWebShell();
      if (result !== "reload") {
        await requestNativeAppPermissions();
      }
    })();
  }, []);

  return null;
}

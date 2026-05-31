"use client";

import "@/lib/pwa/register-app-badge-bridge";
import { restoreNativeAuthSession } from "@/lib/capacitor/native-auth-session";
import { ensureNativeCookieConsent } from "@/lib/capacitor/native-cookie-consent";
import { prepareNativeWebShell } from "@/lib/capacitor/prepare-native-web-shell";
import { requestNativeAppPermissions } from "@/lib/capacitor/request-native-permissions";
import { useEffect } from "react";

/** Pirms PWA SW: atslēdz service worker native čaulā, lai Capacitor plugini (Badge) strādātu. */
export function CapacitorNativeShellBootstrap() {
  useEffect(() => {
    void (async () => {
      ensureNativeCookieConsent();
      const restored = await restoreNativeAuthSession();
      const result = await prepareNativeWebShell();
      if (result === "reload") return;
      if (restored) {
        const path = window.location.pathname;
        if (path === "/login" || path === "/signup" || path === "/forgot-password") {
          window.location.replace("/dashboard?native_shell=1");
          return;
        }
      }
      await requestNativeAppPermissions();
    })();
  }, []);

  return null;
}

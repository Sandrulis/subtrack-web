"use client";

import { useEffect } from "react";
import { ensureAuthedNotifyScriptsLoaded } from "@/components/fs/load-fs-scripts";
import "@/lib/pwa/register-app-badge-bridge";

type AuthedNotifyBootstrapProps = {
  enabled: boolean;
  /**
   * Pēc skriptu ielādes atkārtoti nolasa `#subtrack-subs-bootstrap-json` (demo maršruti, SPA).
   */
  reloadSubscriptionsFromBootstrap?: boolean;
};

/** Ielogotajiem: abonementu bootstrap skripti un paziņojumu panelis visās lapās ar NavDash / NavLanding. */
export function AuthedNotifyBootstrap({
  enabled,
  reloadSubscriptionsFromBootstrap = false,
}: AuthedNotifyBootstrapProps) {
  useEffect(() => {
    if (!enabled) return;

    const onVisible = () => {
      window.fsBootDashAlerts?.();
    };
    document.addEventListener("visibilitychange", onVisible);
    const onNativeShellReady = () => {
      window.fsBootDashAlerts?.();
    };
    window.addEventListener("subtrack:native-shell-ready", onNativeShellReady);

    (async () => {
      try {
        await ensureAuthedNotifyScriptsLoaded();
        if (reloadSubscriptionsFromBootstrap) {
          const reload = (
            window as Window & { subtrackReloadSubscriptionsFromBootstrap?: () => void }
          ).subtrackReloadSubscriptionsFromBootstrap;
          if (typeof reload === "function") reload();
        }
        window.fsBootDashAlerts?.();
      } catch {
        /* ignore */
      }
    })();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("subtrack:native-shell-ready", onNativeShellReady);
    };
  }, [enabled, reloadSubscriptionsFromBootstrap]);

  return null;
}

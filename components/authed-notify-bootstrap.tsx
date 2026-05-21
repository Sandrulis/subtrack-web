"use client";

import { useEffect } from "react";
import { ensureAuthedNotifyScriptsLoaded } from "@/components/fs/load-fs-scripts";
import { syncAppBadgeCount } from "@/lib/pwa/app-badge";

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

    const win = window as Window & { subtrackSyncAppBadge?: (count: number) => void };
    win.subtrackSyncAppBadge = (count) => {
      void syncAppBadgeCount(count);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        window.fsBootDashAlerts?.();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

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
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      delete win.subtrackSyncAppBadge;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, reloadSubscriptionsFromBootstrap]);

  return null;
}

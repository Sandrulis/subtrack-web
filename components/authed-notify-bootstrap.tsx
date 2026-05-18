"use client";

import { useEffect } from "react";
import { ensureAuthedNotifyScriptsLoaded } from "@/components/fs/load-fs-scripts";

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
  }, [enabled, reloadSubscriptionsFromBootstrap]);

  return null;
}

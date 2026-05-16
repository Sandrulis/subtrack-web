"use client";

import { useEffect } from "react";
import { ensureAuthedNotifyScriptsLoaded } from "@/components/fs/load-fs-scripts";

/** Ielogotajiem: kopīgie demo abonementi un paziņojumu panelis visās lapās ar NavDash / NavLanding. */
export function AuthedNotifyBootstrap({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      try {
        await ensureAuthedNotifyScriptsLoaded();
        window.fsBootDashAlerts?.();
      } catch (e) {
        console.error(e);
      }
    })();
  }, [enabled]);

  return null;
}

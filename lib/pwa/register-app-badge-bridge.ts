"use client";

import { syncAppBadgeCount } from "@/lib/pwa/app-badge";

/** Reģistrē agrāk par `dash-alerts.js`, lai launcher badge nesagaida React useEffect. */
if (typeof window !== "undefined") {
  const win = window as Window & { subtrackSyncAppBadge?: (count: number) => void };
  win.subtrackSyncAppBadge = (count) => {
    void syncAppBadgeCount(count);
  };
}

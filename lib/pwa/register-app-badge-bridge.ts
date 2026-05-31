"use client";

import {
  syncAppBadgeCount,
  type LauncherBadgeNotificationCopy,
  type LauncherBadgeSummary,
} from "@/lib/pwa/app-badge";

export type LauncherBadgeSyncPayload = {
  count: number;
  copy?: LauncherBadgeNotificationCopy;
  summary?: LauncherBadgeSummary;
};

/** Reģistrē agrāk par `dash-alerts.js`, lai launcher badge nesagaida React useEffect. */
if (typeof window !== "undefined") {
  const win = window as Window & {
    subtrackSyncAppBadge?: (payload: number | LauncherBadgeSyncPayload) => void;
  };
  win.subtrackSyncAppBadge = (payload) => {
    if (typeof payload === "number") {
      void syncAppBadgeCount(payload);
      return;
    }
    const count = payload?.count ?? 0;
    void syncAppBadgeCount(count, {
      copy: payload?.copy,
      summary: payload?.summary,
    });
  };
}

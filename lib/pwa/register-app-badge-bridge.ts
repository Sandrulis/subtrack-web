"use client";

import {
  syncAppBadgeCount,
  type LauncherBadgeNotificationCopy,
  type LauncherBadgeSummary,
} from "@/lib/pwa/app-badge";
import {
  debugLauncherBadgeState,
  refreshLauncherBadgeFromAlerts,
  testLauncherBadge,
  type TestLauncherBadgeOptions,
} from "@/lib/pwa/test-launcher-badge";

export type LauncherBadgeSyncPayload = {
  count: number;
  copy?: LauncherBadgeNotificationCopy;
  summary?: LauncherBadgeSummary;
};

/** Reģistrē agrāk par `dash-alerts.js`, lai launcher badge nesagaida React useEffect. */
if (typeof window !== "undefined") {
  const win = window as Window & {
    subtrackSyncAppBadge?: (payload: number | LauncherBadgeSyncPayload) => void;
    subtrackTestLauncherBadge?: (opts?: TestLauncherBadgeOptions) => Promise<unknown>;
    subtrackRefreshLauncherBadge?: () => void;
    subtrackDebugLauncherBadge?: () => Promise<unknown>;
  };

  win.subtrackSyncAppBadge = (payload) => {
    if (typeof payload === "number") {
      void syncAppBadgeCount(payload);
      return;
    }
    const count = Number(payload?.count);
    if (!Number.isFinite(count)) return;
    void syncAppBadgeCount(count, {
      copy: payload?.copy,
      summary: payload?.summary,
    });
  };

  win.subtrackTestLauncherBadge = (opts) => testLauncherBadge(opts);
  win.subtrackRefreshLauncherBadge = () => refreshLauncherBadgeFromAlerts();
  win.subtrackDebugLauncherBadge = () => debugLauncherBadgeState();
}

import { Capacitor } from "@capacitor/core";
import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import { buildLauncherBadgeNotificationCopy } from "@/lib/pwa/launcher-badge-notification-copy";
import { syncAppBadgeCount, type SyncAppBadgeOptions } from "@/lib/pwa/app-badge";
import {
  LAUNCHER_BADGE_NOTIFICATION_ID,
  syncNativeLauncherBadgeNotification,
} from "@/lib/pwa/native-launcher-badge-notification";

export type TestLauncherBadgeOptions = {
  count?: number;
  overdue?: number;
  dueToday?: number;
  upcoming?: number;
  familyInvites?: number;
  /** Rāda arī paziņojumu joslā, kamēr app atvērts (tikai tests). */
  showNotificationWhileOpen?: boolean;
};

export type TestLauncherBadgeResult = {
  ok: boolean;
  native: boolean;
  platform: string;
  count: number;
  visibility: string;
  message: string;
};

/**
 * Manuāls tests native appā (Chrome DevTools → Console):
 * `await subtrackTestLauncherBadge({ count: 2, overdue: 1, dueToday: 1 })`
 * `subtrackRefreshLauncherBadge()` – pārlasīt no dash-alerts
 */
export async function testLauncherBadge(
  opts: TestLauncherBadgeOptions = {},
): Promise<TestLauncherBadgeResult> {
  const count = Math.max(0, Math.floor(opts.count ?? 3));
  const summary = {
    overdue: Math.max(0, Math.floor(opts.overdue ?? 1)),
    dueToday: Math.max(0, Math.floor(opts.dueToday ?? 1)),
    upcoming: Math.max(0, Math.floor(opts.upcoming ?? 0)),
    familyInvites: Math.max(0, Math.floor(opts.familyInvites ?? 0)),
  };
  const copy = buildLauncherBadgeNotificationCopy(summary);
  const options: SyncAppBadgeOptions = { copy, summary };

  if (!isNativeCapacitorApp()) {
    await syncAppBadgeCount(count, options);
    return {
      ok: true,
      native: false,
      platform: Capacitor.getPlatform(),
      count,
      visibility: typeof document !== "undefined" ? document.visibilityState : "unknown",
      message: "Web/PWA – Badging API (ja atbalsta).",
    };
  }

  await syncAppBadgeCount(count, options);

  if (opts.showNotificationWhileOpen && Capacitor.getPlatform() === "android") {
    await syncNativeLauncherBadgeNotification(count, copy, summary, true);
  }

  return {
    ok: true,
    native: true,
    platform: Capacitor.getPlatform(),
    count,
    visibility: typeof document !== "undefined" ? document.visibilityState : "unknown",
    message:
      opts.showNotificationWhileOpen
        ? "Badge + paziņojums (arī app atvērts). Pārbaudi arī Home."
        : "Badge iestatīts. Paziņojumam ej Home vai: showNotificationWhileOpen: true",
  };
}

export function refreshLauncherBadgeFromAlerts(): void {
  if (typeof window !== "undefined" && typeof window.fsBootDashAlerts === "function") {
    window.fsBootDashAlerts();
    return;
  }
  console.warn("[subtrack] fsBootDashAlerts nav pieejams – ej uz /dashboard");
}

export async function debugLauncherBadgeState(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {
    isNativeCapacitorApp: isNativeCapacitorApp(),
    platform: Capacitor.getPlatform(),
    visibility: typeof document !== "undefined" ? document.visibilityState : null,
    hasFsBoot: typeof window !== "undefined" && typeof window.fsBootDashAlerts === "function",
    hasSyncBridge:
      typeof window !== "undefined" &&
      typeof (window as Window & { subtrackSyncAppBadge?: unknown }).subtrackSyncAppBadge ===
        "function",
    notificationId: LAUNCHER_BADGE_NOTIFICATION_ID,
  };

  if (isNativeCapacitorApp() && Capacitor.getPlatform() === "android") {
    try {
      const { Badge } = await import("@capawesome/capacitor-badge");
      const { isSupported } = await Badge.isSupported();
      const { count: badgeCount } = await Badge.get();
      out.badgePluginSupported = isSupported;
      out.badgePluginCount = badgeCount;
    } catch (e) {
      out.badgePluginError = String(e);
    }
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      out.notificationPermissions = await LocalNotifications.checkPermissions();
      const pending = await LocalNotifications.getPending();
      out.pendingNotifications = pending.notifications?.filter(
        (n) => n.id === LAUNCHER_BADGE_NOTIFICATION_ID,
      );
    } catch (e) {
      out.notificationError = String(e);
    }
  }

  return out;
}

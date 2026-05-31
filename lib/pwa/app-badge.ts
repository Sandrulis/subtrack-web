import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import type {
  LauncherBadgeNotificationCopy,
  LauncherBadgeSummary,
} from "@/lib/pwa/launcher-badge-notification-copy";
import { setNativeLauncherBadgeCache } from "@/lib/pwa/native-launcher-badge-cache";
import { syncNativeLauncherBadgeNotification } from "@/lib/pwa/native-launcher-badge-notification";

export type { LauncherBadgeNotificationCopy, LauncherBadgeSummary };

export type SyncAppBadgeOptions = {
  copy?: LauncherBadgeNotificationCopy | null;
  summary?: LauncherBadgeSummary | null;
};

/** PWA sākuma ekrāna ikonas skaitītājs (Badging API). Native – `@capawesome/capacitor-badge`. */
export function isAppBadgeSupported(): boolean {
  if (isNativeCapacitorApp()) return true;
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

async function ensureNativeBadgePermissions(
  Badge: typeof import("@capawesome/capacitor-badge").Badge,
): Promise<void> {
  try {
    const { display } = await Badge.checkPermissions();
    if (display !== "granted") {
      await Badge.requestPermissions();
    }
  } catch {
    /* Android: tukšs permission alias – turpinām */
  }
}

async function syncNativeAppBadgeCount(
  count: number,
  options?: SyncAppBadgeOptions,
): Promise<void> {
  try {
    const { Badge } = await import("@capawesome/capacitor-badge");
    await ensureNativeBadgePermissions(Badge);
    if (count > 0) {
      await Badge.set({ count });
    } else {
      await Badge.clear();
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[subtrack] native ShortcutBadger badge failed", err);
    }
  }
  await syncNativeLauncherBadgeNotification(
    count,
    options?.copy,
    options?.summary,
  );
}

async function syncWebAppBadgeCount(count: number): Promise<void> {
  if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) return;
  try {
    if (count > 0) {
      await navigator.setAppBadge!(count);
    } else if ("clearAppBadge" in navigator) {
      await navigator.clearAppBadge!();
    }
  } catch {
    /* nav standalone / nav atbalsta */
  }
}

/** Tas pats skaits kā `#dash-notify-badge` (kavētie + šodien + 7 d. + uzaicinājumi). */
export async function syncAppBadgeCount(
  count: number,
  options?: SyncAppBadgeOptions,
): Promise<void> {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (isNativeCapacitorApp()) {
    setNativeLauncherBadgeCache(safe, options);
    await syncNativeAppBadgeCount(safe, options);
    return;
  }
  await syncWebAppBadgeCount(safe);
}

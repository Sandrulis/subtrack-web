import { Capacitor } from "@capacitor/core";
import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import {
  buildLauncherBadgeNotificationCopy,
  type LauncherBadgeNotificationCopy,
  type LauncherBadgeSummary,
} from "@/lib/pwa/launcher-badge-notification-copy";

/** Viena “spoguļa” paziņojuma ID – Pixel / daudzi launcheri rāda ikonas skaitli no aktīvajiem paziņojumiem. */
export const LAUNCHER_BADGE_NOTIFICATION_ID = 9001;
const LAUNCHER_BADGE_CHANNEL_ID = "repazy_launcher_badge";

let channelReady = false;

function isAndroidNative(): boolean {
  return isNativeCapacitorApp() && Capacitor.getPlatform() === "android";
}

async function ensureLauncherBadgeChannel(): Promise<void> {
  if (channelReady || !isAndroidNative()) return;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.createChannel({
    id: LAUNCHER_BADGE_CHANNEL_ID,
    name: "Payment reminders",
    description: "Launcher icon count for due payments",
    importance: 3,
    visibility: 1,
    vibration: false,
    lights: false,
  });
  channelReady = true;
}

async function ensureNotificationPermission(): Promise<boolean> {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const { display } = await LocalNotifications.checkPermissions();
  if (display === "granted") return true;
  const req = await LocalNotifications.requestPermissions();
  return req.display === "granted";
}

async function cancelLauncherBadgeNotification(): Promise<void> {
  if (!isAndroidNative()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({
      notifications: [{ id: LAUNCHER_BADGE_NOTIFICATION_ID }],
    });
  } catch {
    /* ignore */
  }
}

/**
 * Android: diskrēts paziņojums, lai launcher rādītu skaitli (īpaši Pixel / AOSP).
 * App priekšplānā – noņem no joslas; fons – atjauno.
 */
export async function syncNativeLauncherBadgeNotification(
  count: number,
  copy?: LauncherBadgeNotificationCopy | null,
  summary?: LauncherBadgeSummary | null,
  /** Tests: show shade notification even when app is open. */
  forceShowInForeground = false,
): Promise<void> {
  if (!isAndroidNative()) return;

  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const inForeground =
    typeof document !== "undefined" && document.visibilityState === "visible";

  if (safe <= 0) {
    await cancelLauncherBadgeNotification();
    return;
  }

  if (inForeground && !forceShowInForeground) {
    await cancelLauncherBadgeNotification();
    return;
  }

  const text =
    copy?.title && copy.body?.trim()
      ? copy
      : summary
        ? buildLauncherBadgeNotificationCopy(summary)
        : buildLauncherBadgeNotificationCopy({
            overdue: 0,
            dueToday: 0,
            upcoming: 0,
            familyInvites: safe,
          });

  try {
    const allowed = await ensureNotificationPermission();
    if (!allowed) return;

    await ensureLauncherBadgeChannel();
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    await LocalNotifications.schedule({
      notifications: [
        {
          id: LAUNCHER_BADGE_NOTIFICATION_ID,
          title: text.title,
          body: text.body,
          channelId: LAUNCHER_BADGE_CHANNEL_ID,
          smallIcon: "ic_stat_repazy",
          ongoing: true,
          autoCancel: false,
          silent: true,
          schedule: { at: new Date() },
          extra: { subtrackLauncherBadge: true },
        },
      ],
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[subtrack] launcher badge notification failed", err);
    }
  }
}

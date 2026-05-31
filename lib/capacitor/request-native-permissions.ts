import { Capacitor } from "@capacitor/core";
import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";

const NATIVE_PERMISSIONS_PROMPTED_KEY = "subtrack_native_permissions_prompted";

function isAndroidNative(): boolean {
  return isNativeCapacitorApp() && Capacitor.getPlatform() === "android";
}

export type NativePermissionsResult = {
  notifications: "granted" | "denied" | "prompt" | "unknown";
  badge: "granted" | "denied" | "prompt" | "unknown";
};

/**
 * Android 13+: lūdz paziņojumu atļauju app atvēršanā (badge + joslas teksts).
 * Vienreiz sesijā, lai nepārprasītu pēc katras pārlādes.
 */
export async function requestNativeAppPermissions(
  opts: { force?: boolean } = {},
): Promise<NativePermissionsResult | null> {
  if (!isAndroidNative()) return null;

  try {
    if (!opts.force) {
      const done = sessionStorage.getItem(NATIVE_PERMISSIONS_PROMPTED_KEY) === "1";
      if (done) return null;
    }
  } catch {
    /* ignore */
  }

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 450);
  });

  const result: NativePermissionsResult = {
    notifications: "unknown",
    badge: "unknown",
  };

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const check = await LocalNotifications.checkPermissions();
    if (check.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      result.notifications = req.display ?? "unknown";
    } else {
      result.notifications = "granted";
    }
  } catch {
    result.notifications = "unknown";
  }

  try {
    const { Badge } = await import("@capawesome/capacitor-badge");
    const check = await Badge.checkPermissions();
    if (check.display !== "granted") {
      const req = await Badge.requestPermissions();
      result.badge = req.display ?? "unknown";
    } else {
      result.badge = "granted";
    }
  } catch {
    result.badge = "unknown";
  }

  try {
    sessionStorage.setItem(NATIVE_PERMISSIONS_PROMPTED_KEY, "1");
  } catch {
    /* ignore */
  }

  return result;
}

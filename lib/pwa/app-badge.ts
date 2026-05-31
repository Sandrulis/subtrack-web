import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";

/** PWA sākuma ekrāna ikonas skaitītājs (Badging API). Native – `@capawesome/capacitor-badge`. */
export function isAppBadgeSupported(): boolean {
  if (isNativeCapacitorApp()) return true;
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

async function syncNativeAppBadgeCount(count: number): Promise<void> {
  try {
    const { Badge } = await import("@capawesome/capacitor-badge");
    const { supported } = await Badge.isSupported();
    if (!supported) return;
    if (count > 0) {
      await Badge.set({ count });
    } else {
      await Badge.clear();
    }
  } catch {
    /* launcher neatbalsta badge – klusām */
  }
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
export async function syncAppBadgeCount(count: number): Promise<void> {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (isNativeCapacitorApp()) {
    await syncNativeAppBadgeCount(safe);
    return;
  }
  await syncWebAppBadgeCount(safe);
}

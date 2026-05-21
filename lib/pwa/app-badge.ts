/** PWA sākuma ekrāna ikonas skaitītājs (Badging API). iOS 16.4+ instalētai lietotnei. */
export function isAppBadgeSupported(): boolean {
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

export async function syncAppBadgeCount(count: number): Promise<void> {
  if (!isAppBadgeSupported()) return;
  try {
    if (count > 0) {
      await navigator.setAppBadge!(count);
    } else if ("clearAppBadge" in navigator) {
      await navigator.clearAppBadge!();
    }
  } catch {
    // Nav standalone / nav atbalsta – klusām ignorējam.
  }
}

import type { SyncAppBadgeOptions } from "@/lib/pwa/app-badge";

let cachedCount = 0;
let cachedOptions: SyncAppBadgeOptions | undefined;

export function setNativeLauncherBadgeCache(
  count: number,
  options?: SyncAppBadgeOptions,
): void {
  cachedCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  cachedOptions = options;
}

export function getNativeLauncherBadgeCache(): {
  count: number;
  options?: SyncAppBadgeOptions;
} {
  return { count: cachedCount, options: cachedOptions };
}

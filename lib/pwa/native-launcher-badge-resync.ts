import { Capacitor } from "@capacitor/core";
import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import { syncAppBadgeCount } from "@/lib/pwa/app-badge";
import { getNativeLauncherBadgeCache } from "@/lib/pwa/native-launcher-badge-cache";

let registered = false;

/**
 * Pixel / AOSP: ikonas skaitlis bieži no aktīvā paziņojuma tikai app fonā.
 * Pārsinhronizē pēc Home (visibility hidden), jo priekšplānā paziņojums apzināti noņemts.
 */
export function registerNativeLauncherBadgeResync(): void {
  if (registered || typeof document === "undefined") return;
  if (!isNativeCapacitorApp() || Capacitor.getPlatform() !== "android") return;
  registered = true;

  const resyncWhenBackgrounded = () => {
    if (document.visibilityState !== "hidden") return;
    const { count, options } = getNativeLauncherBadgeCache();
    if (count <= 0) return;
    window.setTimeout(() => {
      if (document.visibilityState !== "hidden") return;
      void syncAppBadgeCount(count, options);
    }, 80);
  };

  document.addEventListener("visibilitychange", resyncWhenBackgrounded);
  window.addEventListener("pagehide", resyncWhenBackgrounded);
}

import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import type { PublicPwaSettings } from "@/lib/pwa/public-pwa-settings";
import { readPwaBannerDismissed } from "@/lib/pwa/install-banner-dismiss";
import { isStandaloneDisplayMode } from "@/lib/pwa/install-prompt";

export const PWA_INSTALL_BANNER_PATHS = new Set([
  "/dashboard",
  "/analytics",
  "/settings",
]);

/**
 * Vai drīkst `preventDefault()` uz `beforeinstallprompt` (vēlāk `prompt()` no pogas).
 * Ja false – pārlūks pats rāda (vai nerāda) noklusējuma instalācijas UI; nav Chrome brīdinājuma par neizsauktu `prompt()`.
 *
 * Plats ekrāns (≥961px, PC): nekad necapturējam – custom banneris un settings poga ir tikai mobilajā platumā.
 */
export function shouldCaptureBeforeInstallPrompt(pwa: PublicPwaSettings): boolean {
  if (!pwa.enabled) return false;
  if (typeof window === "undefined") return false;
  if (isNativeCapacitorApp()) return false;
  if (isStandaloneDisplayMode()) return false;
  if (window.matchMedia("(min-width: 961px)").matches) return false;

  const path = window.location.pathname;

  return (
    pwa.installBannerEnabled &&
    PWA_INSTALL_BANNER_PATHS.has(path) &&
    !readPwaBannerDismissed()
  );
}

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
 */
export function shouldCaptureBeforeInstallPrompt(pwa: PublicPwaSettings): boolean {
  if (!pwa.enabled) return false;
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplayMode()) return false;

  const path = window.location.pathname;
  const mobile = window.matchMedia("(max-width: 960px)").matches;

  const canBanner =
    pwa.installBannerEnabled &&
    mobile &&
    PWA_INSTALL_BANNER_PATHS.has(path) &&
    !readPwaBannerDismissed();

  const canSettings = pwa.installSettingsEnabled && path === "/settings";

  return canBanner || canSettings;
}

import {
  PWA_INSTALL_DISMISS_COOLDOWN_MS,
  PWA_INSTALL_DISMISS_KEY,
} from "@/lib/pwa/defaults";

export function readPwaBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(PWA_INSTALL_DISMISS_KEY);
  if (!raw) return false;
  if (raw === "1") return false;

  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) {
    localStorage.removeItem(PWA_INSTALL_DISMISS_KEY);
    return false;
  }

  const elapsed = Date.now() - dismissedAt;
  if (elapsed >= PWA_INSTALL_DISMISS_COOLDOWN_MS) {
    localStorage.removeItem(PWA_INSTALL_DISMISS_KEY);
    return false;
  }
  return true;
}

export function writePwaBannerDismissed(): void {
  localStorage.setItem(PWA_INSTALL_DISMISS_KEY, String(Date.now()));
}

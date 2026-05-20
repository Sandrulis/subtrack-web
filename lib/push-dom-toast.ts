import { attachToastHoverDismiss } from "@/lib/dom-toast-hover-dismiss";

/**
 * Neliels floating toast uz `#toast-container` (Font Awesome ikonas globālajā layout).
 * Admin (`AdminShell`), FS settings, dashboard utml. satur šo konteineru.
 */
export function pushDomToast(
  message: string,
  type: "success" | "error" | "info",
  options?: { containerId?: string },
): void {
  if (typeof document === "undefined") return;
  const containerId = options?.containerId ?? "toast-container";
  const container = document.getElementById(containerId);
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const prefix =
    type === "success"
      ? '<i class="fa-solid fa-check" aria-hidden="true"></i> '
      : type === "error"
        ? '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> '
        : '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> ';
  const esc = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  toast.innerHTML = prefix + esc(message);
  container.appendChild(toast);
  attachToastHoverDismiss(toast, type === "info" ? 1600 : 2800);
}

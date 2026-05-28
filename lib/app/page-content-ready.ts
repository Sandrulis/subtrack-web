export const SUBTRACK_PAGE_CONTENT_READY_EVENT = "subtrack-page-content-ready";

export const SUBTRACK_PAGE_CONTENT_BOOT_TIMEOUT_MS = 15000;

export function dispatchSubtrackPageContentReady(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SUBTRACK_PAGE_CONTENT_READY_EVENT));
}

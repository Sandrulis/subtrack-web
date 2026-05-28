"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  SUBTRACK_PAGE_CONTENT_BOOT_TIMEOUT_MS,
  SUBTRACK_PAGE_CONTENT_READY_EVENT,
  dispatchSubtrackPageContentReady,
} from "@/lib/app/page-content-ready";

export function AppPageLoadingStatus({
  className = "",
}: {
  className?: string;
}) {
  const { t } = useSubtrackIntl();
  return (
    <div
      className={`app-page-loading-status${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="app-page-loading-spinner" aria-hidden="true" />
      <span className="app-page-loading-text">{t("app.page_loading")}</span>
    </div>
  );
}

export function AppPageContentGate({
  ready,
  children,
  className = "",
}: {
  ready: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`app-page-content-gate${ready ? " app-page-content-gate--ready" : ""}${className ? ` ${className}` : ""}`}
    >
      {!ready ? <AppPageLoadingStatus /> : null}
      <div className="app-page-content-gate-body">{children}</div>
    </div>
  );
}

/** Gaida `/fs/*.js` boot (`subtrackNotifyPageContentReady`). */
export function useFsPageContentReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setReady(true);
    };
    window.addEventListener(SUBTRACK_PAGE_CONTENT_READY_EVENT, markReady);
    const timeout = window.setTimeout(markReady, SUBTRACK_PAGE_CONTENT_BOOT_TIMEOUT_MS);
    return () => {
      cancelled = true;
      window.removeEventListener(SUBTRACK_PAGE_CONTENT_READY_EVENT, markReady);
      window.clearTimeout(timeout);
    };
  }, []);

  return ready;
}

/** Īss klienta hydrācijas logs formām bez FS boot. */
export function useClientPageContentReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready;
}

export { dispatchSubtrackPageContentReady };

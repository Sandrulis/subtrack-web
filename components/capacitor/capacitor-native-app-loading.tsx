"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  NATIVE_SHELL_BACKGROUND,
  NATIVE_SHELL_LOGO_PATH,
} from "@/lib/capacitor/native-shell-brand";
import { useNativeCapacitorApp } from "@/lib/capacitor/use-native-capacitor-app";
import { SUBTRACK_PAGE_CONTENT_READY_EVENT } from "@/lib/app/page-content-ready";
import { useEffect, useState } from "react";

const MIN_VISIBLE_MS = 500;
const MAX_VISIBLE_MS = 20000;
const PROGRESS_TICK_MS = 120;

async function hideNativeSplash(): Promise<void> {
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }
}

/**
 * Kamēr WebView ielādē repazy.com – logo, teksts un progress (ne tukša balta lapa).
 */
export function CapacitorNativeAppLoading() {
  const isNative = useNativeCapacitorApp();
  const { t, systemSiteName } = useSubtrackIntl();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (!isNative) {
      setVisible(false);
      return;
    }
    setVisible(true);

    const started = Date.now();
    let dismissed = false;
    let progressTimer: ReturnType<typeof setInterval> | undefined;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      const elapsed = Date.now() - started;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        setProgress(100);
        window.setTimeout(() => {
          setVisible(false);
          void hideNativeSplash();
        }, 180);
      }, wait);
    };

    progressTimer = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        return p + 2 + Math.random() * 4;
      });
    }, PROGRESS_TICK_MS);

    const onReady = () => dismiss();
    window.addEventListener(SUBTRACK_PAGE_CONTENT_READY_EVENT, onReady);
    window.addEventListener("load", onReady, { once: true });
    window.addEventListener("subtrack:native-shell-ready", onReady);

    const domTimer = window.setTimeout(() => {
      if (document.readyState === "complete" || document.readyState === "interactive") {
        const hasMain =
          document.getElementById("main") ||
          document.querySelector(".auth-card") ||
          document.querySelector(".dash-topbar-shell");
        if (hasMain) dismiss();
      }
    }, 800);

    const maxTimer = window.setTimeout(dismiss, MAX_VISIBLE_MS);

    return () => {
      if (progressTimer) window.clearInterval(progressTimer);
      window.clearTimeout(domTimer);
      window.clearTimeout(maxTimer);
      window.removeEventListener(SUBTRACK_PAGE_CONTENT_READY_EVENT, onReady);
      window.removeEventListener("subtrack:native-shell-ready", onReady);
    };
  }, [isNative]);

  if (!visible) return null;

  const logoSrc = NATIVE_SHELL_LOGO_PATH;

  return (
    <div
      className="cap-native-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: NATIVE_SHELL_BACKGROUND,
        padding: "1.5rem",
      }}
    >
      <div className="cap-native-loading-card">
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt=""
            className="cap-native-loading-logo"
            width={96}
            height={96}
            decoding="async"
          />
        ) : (
          <span className="cap-native-loading-name">{systemSiteName}</span>
        )}
        <p className="cap-native-loading-text">{t("app.page_loading")}</p>
        <div className="cap-native-loading-bar" aria-hidden="true">
          <div
            className="cap-native-loading-bar-fill"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

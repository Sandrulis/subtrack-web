"use client";

import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import { useNativeCapacitorApp } from "@/lib/capacitor/use-native-capacitor-app";
import { SUBTRACK_PAGE_CONTENT_READY_EVENT } from "@/lib/app/page-content-ready";
import { useEffect, useLayoutEffect } from "react";

const MIN_VISIBLE_MS = 600;
const MAX_VISIBLE_MS = 25000;
const PROGRESS_TICK_MS = 120;
const CONTENT_POLL_MS = 200;
const BOOT_ID = "subtrack-native-boot";
const BOOT_PROGRESS_ID = "subtrack-native-boot-progress";
const PENDING_CLASS = "native-shell-pending";

async function hideNativeSplash(): Promise<void> {
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }
}

function isBootOverlayVisible(): boolean {
  const boot = document.getElementById(BOOT_ID);
  if (!boot || boot.hidden) return false;
  const display = boot.style.display || getComputedStyle(boot).display;
  return display !== "none";
}

function hasNativeShellContent(): boolean {
  return Boolean(
    document.querySelector(".auth-card") ||
      document.querySelector(".dash-topbar-shell") ||
      document.getElementById("main"),
  );
}

function showBootOverlay(): void {
  document.documentElement.classList.add("native-shell", PENDING_CLASS);
  const boot = document.getElementById(BOOT_ID);
  if (!boot) return;
  boot.hidden = false;
  boot.style.display = "flex";
}

function hideBootOverlay(): void {
  document.documentElement.classList.remove(PENDING_CLASS);
  const boot = document.getElementById(BOOT_ID);
  if (!boot) return;
  boot.hidden = true;
  boot.style.display = "none";
}

function setBootProgress(percent: number): void {
  const fill = document.getElementById(BOOT_PROGRESS_ID);
  if (!fill) return;
  fill.style.width = `${Math.min(100, percent)}%`;
}

function hideSplashAfterBootPainted(): void {
  const tick = () => {
    if (!isBootOverlayVisible()) return;
    void hideNativeSplash();
  };
  requestAnimationFrame(() => requestAnimationFrame(tick));
}

/**
 * Native ielāde – kontrolē SSR boot overlay (#subtrack-native-boot).
 */
export function CapacitorNativeAppLoading() {
  const isNative = useNativeCapacitorApp();

  useLayoutEffect(() => {
    if (!isNative) return;
    showBootOverlay();
    hideSplashAfterBootPainted();
  }, [isNative]);

  useEffect(() => {
    if (!isNative) {
      if (!document.documentElement.classList.contains(PENDING_CLASS)) {
        hideBootOverlay();
      }
      return;
    }

    if (isNativeCapacitorApp()) {
      showBootOverlay();
      hideSplashAfterBootPainted();
    }

    const started = Date.now();
    let dismissed = false;
    let progress = 12;
    let progressTimer: number | undefined;
    let contentPoll: number | undefined;

    const dismiss = () => {
      if (dismissed) return;
      if (!hasNativeShellContent()) return;
      if (document.readyState !== "complete") return;

      dismissed = true;
      const elapsed = Date.now() - started;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        setBootProgress(100);
        window.setTimeout(hideBootOverlay, 200);
      }, wait);
    };

    progressTimer = window.setInterval(() => {
      progress = progress >= 92 ? progress : progress + 2 + Math.random() * 4;
      setBootProgress(progress);
    }, PROGRESS_TICK_MS);

    contentPoll = window.setInterval(dismiss, CONTENT_POLL_MS);

    const onPageReady = () => dismiss();
    window.addEventListener(SUBTRACK_PAGE_CONTENT_READY_EVENT, onPageReady);

    const maxTimer = window.setTimeout(() => {
      dismissed = true;
      setBootProgress(100);
      window.setTimeout(hideBootOverlay, 200);
    }, MAX_VISIBLE_MS);

    return () => {
      if (progressTimer) window.clearInterval(progressTimer);
      if (contentPoll) window.clearInterval(contentPoll);
      window.clearTimeout(maxTimer);
      window.removeEventListener(SUBTRACK_PAGE_CONTENT_READY_EVENT, onPageReady);
    };
  }, [isNative]);

  return null;
}

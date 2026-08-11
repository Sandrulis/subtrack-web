"use client";

import { useEffect } from "react";

export const FS_I18N_BOOTSTRAP_TEMPLATE_ID = "subtrack-fs-i18n-bootstrap";

/** No `<template>` (JSON no servera -> `hydrateFsI18nFromTemplate()`). */
type FsI18nBootstrapPayload = {
  phrases: Record<string, string>;
  meta: { intlLocale: string };
};

/** Parsē `#subtrack-fs-i18n-bootstrap` un uzstāda paneļa globāļus pirms `/fs/*.js`. */
export function hydrateFsI18nFromTemplate(): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(FS_I18N_BOOTSTRAP_TEMPLATE_ID);
  if (!el || !(el instanceof HTMLTemplateElement)) return;

  const raw = el.content.textContent?.trim() ?? "";
  if (!raw) return;

  let data: FsI18nBootstrapPayload;
  try {
    data = JSON.parse(raw) as FsI18nBootstrapPayload;
  } catch {
    return;
  }

  (
    window as Window & {
      __SUBTRACK_FS_I18N?: Record<string, string>;
      __SUBTRACK_FS_META?: { intlLocale: string };
    }
  ).__SUBTRACK_FS_I18N = data.phrases;
  (
    window as Window & { __SUBTRACK_FS_META?: { intlLocale: string } }
  ).__SUBTRACK_FS_META = data.meta;
}

const scriptInflight = new Map<string, Promise<void>>();

/** Abonementu bootstrap + palīgfunkcijas + augšējās joslas paziņojumi. */
export const AUTHED_NOTIFY_SCRIPTS = [
  "/fs/js/display-preferences-format.js",
  "/fs/js/subscriptions-data.js",
  "/fs/js/subscriptions-helpers.js",
  "/fs/js/dash-alerts.js",
] as const;

/**
 * Ielādē FS skriptus pa atkarību līmeņiem; katrā līmenī – paralēli (`async`).
 * 1) prefs + subscriptions-data; 2) helpers; 3) dash-alerts (tikai notify ceļam).
 */
async function loadScriptsInTiers(
  tiers: readonly (readonly string[])[],
): Promise<void> {
  for (const tier of tiers) {
    await Promise.all(tier.map((src) => loadScriptOnce(src)));
  }
}

/** Prefs + data + helpers – pietiek panelim pirms gate (bez dash-alerts). */
export async function ensureAuthedCoreScriptsLoaded(): Promise<void> {
  hydrateFsI18nFromTemplate();
  await loadScriptsInTiers([
    [
      "/fs/js/display-preferences-format.js",
      "/fs/js/subscriptions-data.js",
    ],
    ["/fs/js/subscriptions-helpers.js"],
  ]);
}

export async function ensureAuthedNotifyScriptsLoaded(): Promise<void> {
  await ensureAuthedCoreScriptsLoaded();
  await loadScriptOnce("/fs/js/dash-alerts.js");
}

/** `/dashboard` – kritiskais ceļš līdz gate (bez dash-alerts / modal guard). */
export async function loadDashboardPageScripts(): Promise<void> {
  await ensureAuthedCoreScriptsLoaded();
  await loadScriptOnce("/fs/js/dashboard.js");
}

/** Pēc gate: zvans + modāļa overlay (nebloķē SI/LCP). */
export async function loadDashboardDeferredScripts(): Promise<void> {
  await Promise.all([
    loadScriptOnce("/fs/js/dash-alerts.js"),
    loadScriptOnce("/fs/js/modal-overlay-guard.js"),
  ]);
}

/** `/analytics` – kopīgie notify skripti + analytics.js. */
export async function loadAnalyticsPageScripts(): Promise<void> {
  await ensureAuthedNotifyScriptsLoaded();
  await loadScriptOnce("/fs/js/analytics.js");
}

export function loadScriptOnce(src: string): Promise<void> {
  hydrateFsI18nFromTemplate();
  const abs = new URL(src, window.location.origin).href;
  if (Array.from(document.scripts).some((s) => s.src === abs)) {
    return Promise.resolve();
  }

  const pending = scriptInflight.get(abs);
  if (pending) return pending;

  const promise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      scriptInflight.delete(abs);
      resolve();
    };
    s.onerror = () => {
      scriptInflight.delete(abs);
      reject(new Error(`Neizdevās ielādēt: ${src}`));
    };
    document.body.appendChild(s);
  });

  scriptInflight.set(abs, promise);
  return promise;
}

export function FsScripts({ srcs }: { srcs: readonly string[] }) {
  useEffect(() => {
    let cancelled = false;
    const list = [...srcs];
    (async () => {
      for (const src of list) {
        if (cancelled) break;
        try {
          await loadScriptOnce(src);
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // FS skripti jāielādē reizi pēc mount (atkārtota ielāde novērsta loadScriptOnce).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

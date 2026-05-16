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

/** Abonementu demo dati + palīgfunkcijas + augšējās joslas paziņojumi (ielādējas secīgi). */
export const AUTHED_NOTIFY_SCRIPTS = [
  "/fs/js/subscriptions-data.js",
  "/fs/js/subscriptions-helpers.js",
  "/fs/js/dash-alerts.js",
] as const;

export async function ensureAuthedNotifyScriptsLoaded(): Promise<void> {
  hydrateFsI18nFromTemplate();
  for (const src of AUTHED_NOTIFY_SCRIPTS) {
    await loadScriptOnce(src);
  }
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
    s.async = false;
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
        } catch (e) {
          console.error(e);
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

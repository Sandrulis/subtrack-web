"use client";

import { useEffect } from "react";
import {
  applyUiLocaleInBrowser,
  isValidPreferredLanguageCode,
  SUBTRACK_UI_LOCALE_COOKIE,
} from "@/lib/html-lang";
import { readDisplayPreferencesFromLocalStorage } from "@/lib/user-display-preferences";

/**
 * Sinhronizē `<html lang>` un sīkdatni ar servera lokāli.
 * Viesim: `localStorage` tiek lietots tikai ar `subtrack_ui_locale` sīkdatni (manuāla izvēle).
 * Ielogotam: tikai servera lokāle (profils), lai `localStorage` nepārrakstītu DB izvēli.
 */
export function HtmlLangBridge({
  serverUiLocaleCode,
  preferLocalStorageLocale = false,
}: {
  serverUiLocaleCode: string;
  preferLocalStorageLocale?: boolean;
}) {
  useEffect(() => {
    if (preferLocalStorageLocale) {
      const hasExplicitCookie =
        typeof document !== "undefined" &&
        document.cookie.split(";").some((c) => {
          const t = c.trim();
          return t.startsWith(`${SUBTRACK_UI_LOCALE_COOKIE}=`);
        });
      if (hasExplicitCookie) {
        const local = readDisplayPreferencesFromLocalStorage();
        const localLang = local.interface_language_code;
        if (typeof localLang === "string" && isValidPreferredLanguageCode(localLang)) {
          applyUiLocaleInBrowser(localLang);
          return;
        }
      }
    }
    applyUiLocaleInBrowser(serverUiLocaleCode);
  }, [serverUiLocaleCode, preferLocalStorageLocale]);

  return null;
}

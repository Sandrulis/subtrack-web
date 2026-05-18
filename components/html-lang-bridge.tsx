"use client";

import { useEffect } from "react";
import { applyUiLocaleInBrowser, isValidPreferredLanguageCode } from "@/lib/html-lang";
import { readDisplayPreferencesFromLocalStorage } from "@/lib/user-display-preferences";

/**
 * Sinhronizē `<html lang>` un sīkdatni ar servera lokāli.
 * Viesim: derīga valoda no `localStorage` var pārrakstīt (kešs pirms sīkdatnes).
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
      const local = readDisplayPreferencesFromLocalStorage();
      const localLang = local.interface_language_code;
      if (typeof localLang === "string" && isValidPreferredLanguageCode(localLang)) {
        applyUiLocaleInBrowser(localLang);
        return;
      }
    }
    applyUiLocaleInBrowser(serverUiLocaleCode);
  }, [serverUiLocaleCode, preferLocalStorageLocale]);

  return null;
}

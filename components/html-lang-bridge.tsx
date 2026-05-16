"use client";

import { useEffect } from "react";
import { applyUiLocaleInBrowser } from "@/lib/html-lang";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
  readDisplayPreferencesFromLocalStorage,
} from "@/lib/user-display-preferences";

/** Sinhronizē `<html lang>` un sīkdati no `display_preferences` keša (`localStorage`). */
export function HtmlLangBridge({
  defaultInterfaceLanguageCode,
}: {
  /** No `public.languages.is_default` (kešots katalogs). */
  defaultInterfaceLanguageCode: string;
}) {
  useEffect(() => {
    const base = {
      ...DISPLAY_PREFERENCES_DEFAULTS,
      interface_language_code: defaultInterfaceLanguageCode.trim().toLowerCase(),
    };
    const local = readDisplayPreferencesFromLocalStorage();
    const merged = mergeDisplayPreferences(local, base);
    applyUiLocaleInBrowser(merged.interface_language_code);
  }, [defaultInterfaceLanguageCode]);

  return null;
}

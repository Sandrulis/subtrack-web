"use client";

import { ensureNativeCookieConsent } from "@/lib/capacitor/native-cookie-consent";
import {
  persistNativeAuthSession,
  restoreNativeAuthSession,
} from "@/lib/capacitor/native-auth-session";
import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import { useNativeCapacitorApp } from "@/lib/capacitor/use-native-capacitor-app";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useRef } from "react";

const GUEST_ENTRY_PATHS = ["/login", "/signup", "/forgot-password"];

function isGuestEntryPath(pathname: string): boolean {
  return GUEST_ENTRY_PATHS.includes(pathname);
}

function redirectAuthedNativeFromGuestEntry(): void {
  const path = window.location.pathname;
  if (!isGuestEntryPath(path)) return;
  const target = "/dashboard?native_shell=1";
  if (`${path}${window.location.search}` === target) return;
  window.location.replace(target);
}

/**
 * Native WebView: Supabase sesija Preferences + atjaunošana pēc app restart.
 */
export function CapacitorNativeAuthPersist() {
  const isNative = useNativeCapacitorApp();
  const restoreStarted = useRef(false);

  useEffect(() => {
    if (!isNative) return;
    ensureNativeCookieConsent();
  }, [isNative]);

  useEffect(() => {
    if (!isNative || restoreStarted.current) return;
    restoreStarted.current = true;

    void (async () => {
      const restored = await restoreNativeAuthSession();
      if (restored) {
        redirectAuthedNativeFromGuestEntry();
      }
    })();
  }, [isNative]);

  useEffect(() => {
    if (!isNative || !isNativeCapacitorApp()) return;

    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token && session.refresh_token) {
        await persistNativeAuthSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at ?? undefined,
        });
        return;
      }
      await persistNativeAuthSession(null);
    });

    return () => subscription.unsubscribe();
  }, [isNative]);

  return null;
}

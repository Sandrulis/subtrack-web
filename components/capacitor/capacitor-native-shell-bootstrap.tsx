"use client";

import "@/lib/pwa/register-app-badge-bridge";
import { prepareNativeWebShell } from "@/lib/capacitor/prepare-native-web-shell";
import { useEffect } from "react";

/** Pirms PWA SW: atslēdz service worker native čaulā, lai Capacitor plugini (Badge) strādātu. */
export function CapacitorNativeShellBootstrap() {
  useEffect(() => {
    void prepareNativeWebShell();
  }, []);

  return null;
}

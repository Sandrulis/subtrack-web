"use client";

import { PWA_CACHE_REVISION_KEY } from "@/lib/pwa/defaults";
import type { PublicPwaSettings } from "@/lib/pwa/public-pwa-settings";
import { useEffect } from "react";

export function PwaSwRegister({ pwa }: { pwa: PublicPwaSettings }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!pwa.enabled) return;
    if (!("serviceWorker" in navigator)) return;

    const revisionKey = String(pwa.cacheRevision);

    void (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const stored = localStorage.getItem(PWA_CACHE_REVISION_KEY);
        if (stored !== revisionKey) {
          await reg.update();
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((k) => k.startsWith("repazy-") || k.startsWith("serwist-") || k.includes("pages"))
              .map((k) => caches.delete(k)),
          );
          localStorage.setItem(PWA_CACHE_REVISION_KEY, revisionKey);
        }
      } catch {
        /* ignore SW registration errors */
      }
    })();
  }, [pwa.cacheRevision, pwa.enabled]);

  return null;
}

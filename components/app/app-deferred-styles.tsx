"use client";

import { useLayoutEffect } from "react";

const DEFERRED_STYLES_ID = "subtrack-app-deferred-css";
const DEFERRED_HREF = "/styles/subtrack-app-deferred.bundle.css";

/**
 * App CSS, kas nav vajadzīgs pirmajam paint (modāļi, admin, subscribe, legal, demo).
 * media=print → onload → all, lai nebloķētu renderi (Lighthouse render-blocking).
 */
export function AppDeferredStyles() {
  useLayoutEffect(() => {
    if (document.getElementById(DEFERRED_STYLES_ID)) return;

    const link = document.createElement("link");
    link.id = DEFERRED_STYLES_ID;
    link.rel = "stylesheet";
    link.href = DEFERRED_HREF;
    link.media = "print";
    link.onload = () => {
      link.media = "all";
      link.onload = null;
    };
    link.onerror = () => {
      link.media = "all";
    };
    document.head.appendChild(link);
  }, []);

  return null;
}

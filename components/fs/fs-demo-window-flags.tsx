"use client";

import { useEffect } from "react";

/**
 * React 19 neizpilda `<script>` klienta komponentēs; FS kods gaida `window` karodziņus pirms skriptu ielādes.
 * Efekts ir bērnam pirms `DashboardFsView` ielādes efekta, tāpēc karodziņš ir uzstādīts pirms `loadScriptOnce`.
 */
export function FsDemoDashboardWindowFlag() {
  useEffect(() => {
    window.__SUBTRACK_DEMO_DASHBOARD__ = true;
    return () => {
      delete window.__SUBTRACK_DEMO_DASHBOARD__;
    };
  }, []);
  return null;
}

/** Publiskā `/demo/analytics` – bez `<script>` maršruta līmenī. */
export function FsDemoAnalyticsWindowFlag() {
  useEffect(() => {
    window.__SUBTRACK_DEMO_ANALYTICS__ = true;
    return () => {
      delete window.__SUBTRACK_DEMO_ANALYTICS__;
    };
  }, []);
  return null;
}

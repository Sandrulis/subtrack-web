"use client";

import { FsScripts } from "@/components/fs/load-fs-scripts";

const LANDING_NOTIFY_SCRIPTS = [
  "/fs/js/subscriptions-empty.js",
  "/fs/js/subscriptions-helpers.js",
  "/fs/js/dash-alerts.js",
] as const;

/** Paziņojumu zvana uzvedībai sākumlapā (bez demo ierakstiem). */
export function LandingSessionScripts() {
  return <FsScripts srcs={LANDING_NOTIFY_SCRIPTS} />;
}

// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/sentry/is-sentry-enabled";

const sentryEnabled = isSentryEnabled();

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: sentryEnabled,

  debug:
    process.env.NODE_ENV === "development" &&
    process.env.SENTRY_ENABLED?.trim() === "1",

  sendDefaultPii: true,

  tracesSampleRate: sentryEnabled
    ? process.env.NODE_ENV === "development"
      ? 1.0
      : 0.1
    : 0,

  replaysSessionSampleRate: sentryEnabled ? 0.01 : 0,
  replaysOnErrorSampleRate: sentryEnabled ? 1.0 : 0,

  enableLogs: sentryEnabled,

  integrations: [],
});

/** Session Replay – atsevišķs chunks pēc idle, lai neslogotu pirmo paint / Lighthouse. */
function scheduleSentryReplayIntegration(): void {
  if (!sentryEnabled || typeof window === "undefined") return;

  const attach = () => {
    void import("@sentry/browser")
      .then(({ replayIntegration }) => {
        Sentry.addIntegration(replayIntegration());
      })
      .catch(() => {});
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(attach, { timeout: 8000 });
  } else {
    globalThis.setTimeout(attach, 4000);
  }
}

scheduleSentryReplayIntegration();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

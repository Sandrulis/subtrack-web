// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled } from "@/lib/sentry/is-sentry-enabled";

const sentryEnabled = isSentryEnabled();

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: sentryEnabled,

  sendDefaultPii: true,

  tracesSampleRate: sentryEnabled ? 0.1 : 0,

  enableLogs: sentryEnabled,
});

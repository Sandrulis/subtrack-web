import * as Sentry from "@sentry/nextjs";
import type { CronJobId } from "@/lib/cron/cron-job-registry";
import { isSentryEnabled } from "@/lib/sentry/is-sentry-enabled";

/** cron-job.org: `0 * * * *` UTC katram `/api/cron/*` jobam. */
const HOURLY_UTC_MONITOR = {
  schedule: { type: "crontab" as const, value: "0 * * * *" },
  checkinMargin: 5,
  maxRuntime: 20,
  timezone: "UTC",
} as const;

export async function withSentryCronMonitor<T>(
  jobId: CronJobId,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isSentryEnabled()) {
    return fn();
  }
  return Sentry.withMonitor(`subtrack-cron-${jobId}`, fn, HOURLY_UTC_MONITOR);
}

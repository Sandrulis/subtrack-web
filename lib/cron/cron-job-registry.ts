export const CRON_JOB_IDS = [
  "overdue-payment-emails",
  "due-today-payment-emails",
  "weekly-summary-emails",
  "trial-ending-emails",
  "payment-push-notifications",
] as const;

export type CronJobId = (typeof CRON_JOB_IDS)[number];

export function isCronJobId(value: string): value is CronJobId {
  return (CRON_JOB_IDS as readonly string[]).includes(value);
}

export function cronJobApiPath(job: CronJobId): string {
  return `/api/cron/${job}`;
}

/** Nedēļas / trial cron laika logi tiek apieti ar `force=1`. */
export function cronJobSupportsForceSchedule(job: CronJobId): boolean {
  return (
    job === "weekly-summary-emails" ||
    job === "trial-ending-emails"
  );
}

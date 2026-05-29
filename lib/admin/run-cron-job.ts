import {
  cronJobApiPath,
  cronJobSupportsForceSchedule,
  type CronJobId,
} from "@/lib/cron/cron-job-registry";
import { getPublicSiteUrl } from "@/lib/site-url";

export type RunCronJobResult = {
  ok: boolean;
  status: number;
  body: unknown;
  forcedSchedule: boolean;
};

export async function runCronJobFromServer(
  job: CronJobId,
  options?: { forceSchedule?: boolean; testUserId?: string },
): Promise<RunCronJobResult> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return {
      ok: false,
      status: 500,
      body: { success: false, message: "CRON_SECRET nav iestatīts serverī." },
      forcedSchedule: false,
    };
  }

  const force =
    options?.forceSchedule === true && cronJobSupportsForceSchedule(job);
  const testUserId = options?.testUserId?.trim();
  const path = cronJobApiPath(job);
  const url = new URL(path, `${getPublicSiteUrl()}/`);
  if (force) url.searchParams.set("force", "1");
  if (testUserId) url.searchParams.set("testUserId", testUserId);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fetch neizdevās.";
    return {
      ok: false,
      status: 500,
      body: { success: false, message: msg },
      forcedSchedule: force,
    };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = { success: false, message: "Nav JSON atbildes." };
  }

  return {
    ok: res.ok,
    status: res.status,
    body,
    forcedSchedule: force,
  };
}

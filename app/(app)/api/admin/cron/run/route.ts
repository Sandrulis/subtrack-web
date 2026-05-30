import { NextResponse } from "next/server";
import { runCronJobFromServer } from "@/lib/admin/run-cron-job";
import { asJsonRecord, parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiAdmin } from "@/lib/api/require-api-admin";
import { apiJsonError } from "@/lib/api/json-response";
import { isCronJobId } from "@/lib/cron/cron-job-registry";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(
    request,
    await getUiPhraseForRequest("api.admin.cron_run.bad_request"),
  );
  if (!parsedBody.ok) return parsedBody.response;

  const rec = asJsonRecord(parsedBody.body);
  const jobRaw = typeof rec.job === "string" ? rec.job.trim() : "";
  const forceSchedule = rec.forceSchedule === true;

  if (!isCronJobId(jobRaw)) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.admin.cron_run.bad_request"),
    );
  }

  const admin = await requireApiAdmin({
    unauthorized: await getUiPhraseForRequest("api.admin.cron_run.unauthorized"),
    forbidden: await getUiPhraseForRequest("api.admin.cron_run.forbidden"),
  });
  if (!admin.ok) return admin.response;

  const result = await runCronJobFromServer(jobRaw, {
    forceSchedule,
    testUserId: admin.user.id,
  });

  return NextResponse.json({
    success: result.ok,
    status: result.status,
    forcedSchedule: result.forcedSchedule,
    cron: result.body,
  });
}

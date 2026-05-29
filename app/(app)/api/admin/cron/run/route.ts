import { NextResponse } from "next/server";
import { runCronJobFromServer } from "@/lib/admin/run-cron-job";
import { isCronJobId } from "@/lib/cron/cron-job-registry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.cron_run.bad_request"),
      },
      { status: 400 },
    );
  }

  const rec =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const jobRaw = typeof rec.job === "string" ? rec.job.trim() : "";
  const forceSchedule = rec.forceSchedule === true;

  if (!isCronJobId(jobRaw)) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.cron_run.bad_request"),
      },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  if (!sessionUser) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.cron_run.unauthorized"),
      },
      { status: 401 },
    );
  }

  const { data: isAdminRpc, error: adminRpcErr } = await supabase.rpc(
    "current_user_is_admin",
  );
  if (adminRpcErr || isAdminRpc !== true) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.cron_run.forbidden"),
      },
      { status: 403 },
    );
  }

  const result = await runCronJobFromServer(jobRaw, {
    forceSchedule,
    testUserId: sessionUser.id,
  });

  return NextResponse.json({
    success: result.ok,
    status: result.status,
    forcedSchedule: result.forcedSchedule,
    cron: result.body,
  });
}

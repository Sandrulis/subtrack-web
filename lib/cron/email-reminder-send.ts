import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { CronJobId } from "@/lib/cron/cron-job-registry";
import { withSentryCronMonitor } from "@/lib/cron/sentry-cron-monitor";
import { authorizeCron } from "@/lib/security/cron-auth";
import { apiJsonError } from "@/lib/api/json-response";

export function createAuthorizedCronGetRoute(
  monitorName: CronJobId,
  handler: (request: Request) => Promise<NextResponse | Response>,
) {
  return async function GET(request: Request) {
    if (!authorizeCron(request)) {
      return apiJsonError(401, "Unauthorized");
    }
    return withSentryCronMonitor(monitorName, () => handler(request));
  };
}

export type CronTransactionalMailResult = {
  ok: boolean;
  reason?: string;
  message?: string;
};

export type CronEmailSendCounters = {
  sent: number;
  skipped: number;
  errors: string[];
};

export function applyCronMailSendResult(
  mail: CronTransactionalMailResult,
  email: string,
  counters: CronEmailSendCounters,
): "sent_pending_log" | "skipped" | "failed" {
  if (!mail.ok) {
    if (mail.reason === "not_configured") {
      counters.skipped += 1;
      return "skipped";
    }
    counters.errors.push(`${email}: ${mail.message ?? "send failed"}`);
    return "failed";
  }
  return "sent_pending_log";
}

export async function logEmailReminderAndCountSent(params: {
  supabase: SupabaseClient;
  isTest: boolean;
  sentUtcDay: string;
  userId: string;
  subscriptionId: string | null;
  reminderType: string;
  email: string;
  counters: CronEmailSendCounters;
}): Promise<void> {
  const {
    supabase,
    isTest,
    sentUtcDay,
    userId,
    subscriptionId,
    reminderType,
    email,
    counters,
  } = params;

  if (isTest) {
    counters.sent += 1;
    return;
  }

  const { error: logErr } = await supabase.from("email_reminder_log").insert({
    user_id: userId,
    subscription_id: subscriptionId,
    reminder_type: reminderType,
    sent_on: sentUtcDay,
  });

  if (logErr) {
    counters.errors.push(`${email}: nosūtīts, žurnāls – ${logErr.message}`);
  } else {
    counters.sent += 1;
  }
}

export function buildCronEmailStatsBody(params: {
  errors: string[];
  sent: number;
  skipped: number;
  isTest: boolean;
  extra?: Record<string, unknown>;
}) {
  return {
    success: params.errors.length === 0,
    sent: params.sent,
    skipped: params.skipped,
    testMode: params.isTest,
    errors: params.errors.slice(0, 20),
    ...params.extra,
  };
}

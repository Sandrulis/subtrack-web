import {
  adminTestLastSeenFormatted,
  cronIncludesUser,
  getCronTestUserId,
  isCronAdminTestRun,
} from "@/lib/cron/cron-admin-test";
import {
  applyCronMailSendResult,
  buildCronEmailStatsBody,
  logEmailReminderAndCountSent,
} from "@/lib/cron/email-reminder-send";
import {
  formatCronEmailDate,
  loadEmailCronContext,
  parseUserLocaleAndTz,
  todayIsoUtc,
  userWantsEmail,
} from "@/lib/cron/email-cron-common";
import { isCronForceRun } from "@/lib/cron/cron-force-query";
import { getUserLocalParts } from "@/lib/cron/user-local-schedule";
import { daysInactiveSinceLastSeen } from "@/lib/cron/win-back-inactivity";
import {
  isTransactionalEmailConfigured,
  sendWinBackEmail,
  type WinBackTemplateId,
} from "@/lib/emails/send-transactional";

export type WinBackInactiveDays = 7 | 30;

export type WinBackReminderType = "win_back_7d" | "win_back_30d";

const WIN_BACK_CONFIG: Record<
  WinBackInactiveDays,
  { reminderType: WinBackReminderType; templateId: WinBackTemplateId }
> = {
  7: { reminderType: "win_back_7d", templateId: "win_back_7d" },
  30: { reminderType: "win_back_30d", templateId: "win_back_30d" },
};

export async function runWinBackEmailsCron(
  request: Request,
  inactiveDays: WinBackInactiveDays,
): Promise<Response> {
  if (!isTransactionalEmailConfigured()) {
    return Response.json({
      success: false,
      message: "RESEND_API_KEY un EMAIL_FROM nav konfigurēti.",
    });
  }

  const ctx = await loadEmailCronContext();
  if ("error" in ctx) {
    return Response.json({ success: false, message: ctx.error }, { status: ctx.status });
  }

  const { supabase, siteUrl, systemName, templatesStore, systemDisplayPreferences } = ctx;
  const { reminderType, templateId } = WIN_BACK_CONFIG[inactiveDays];
  const sentUtcDay = todayIsoUtc();
  const testUserId = getCronTestUserId(request);
  const isTest = isCronAdminTestRun(request);
  const force = isCronForceRun(request) || isTest;

  let usersQuery = supabase
    .from("users")
    .select("id, email, last_seen, display_preferences, email_notification_preferences");

  if (testUserId) {
    usersQuery = usersQuery.eq("id", testUserId);
  }

  const { data: users, error: usersErr } = await usersQuery;

  if (usersErr) {
    return Response.json({ success: false, message: usersErr.message }, { status: 500 });
  }

  const counters = { sent: 0, skipped: 0, errors: [] as string[] };

  for (const row of users ?? []) {
    if (!cronIncludesUser(row.id, testUserId)) {
      counters.skipped += 1;
      continue;
    }
    const email = row.email?.trim();
    if (!email) {
      counters.skipped += 1;
      continue;
    }
    if (!isTest && !userWantsEmail(row.email_notification_preferences, "winBack")) {
      counters.skipped += 1;
      continue;
    }

    const { timezone } = parseUserLocaleAndTz(
      row.display_preferences,
      systemDisplayPreferences,
    );

    if (!isTest) {
      const daysInactive = daysInactiveSinceLastSeen(row.last_seen, timezone);
      if (daysInactive !== inactiveDays) {
        counters.skipped += 1;
        continue;
      }
    }

    const local = getUserLocalParts(timezone);
    if (!force && local.hour !== 9) {
      counters.skipped += 1;
      continue;
    }

    if (!isTest) {
      const { data: already } = await supabase
        .from("email_reminder_log")
        .select("id")
        .eq("user_id", row.id)
        .eq("reminder_type", reminderType)
        .eq("sent_on", sentUtcDay)
        .maybeSingle();

      if (already) {
        counters.skipped += 1;
        continue;
      }
    }

    const { locale } = parseUserLocaleAndTz(
      row.display_preferences,
      systemDisplayPreferences,
    );
    const lastSeenFormatted = isTest
      ? adminTestLastSeenFormatted(row.display_preferences, systemDisplayPreferences)
      : row.last_seen
        ? formatCronEmailDate(
            new Date(row.last_seen),
            row.display_preferences,
            systemDisplayPreferences,
          )
        : "";

    const mail = await sendWinBackEmail({
      to: email,
      locale,
      systemName,
      siteUrl,
      templatesStore,
      templateId,
      inactiveDays,
      lastSeenFormatted,
    });

    const outcome = applyCronMailSendResult(mail, email, counters);
    if (outcome !== "sent_pending_log") continue;

    await logEmailReminderAndCountSent({
      supabase,
      isTest,
      sentUtcDay,
      userId: row.id,
      subscriptionId: null,
      reminderType,
      email,
      counters,
    });
  }

  return Response.json(
    buildCronEmailStatsBody({
      errors: counters.errors,
      sent: counters.sent,
      skipped: counters.skipped,
      isTest,
      extra: { inactiveDays },
    }),
  );
}

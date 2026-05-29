import {
  adminTestLastSeenFormatted,
  cronIncludesUser,
  getCronTestUserId,
  isCronAdminTestRun,
} from "@/lib/cron/cron-admin-test";
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

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of users ?? []) {
    if (!cronIncludesUser(row.id, testUserId)) {
      skipped += 1;
      continue;
    }
    const email = row.email?.trim();
    if (!email) {
      skipped += 1;
      continue;
    }
    if (!isTest && !userWantsEmail(row.email_notification_preferences, "winBack")) {
      skipped += 1;
      continue;
    }

    const { timezone } = parseUserLocaleAndTz(
      row.display_preferences,
      systemDisplayPreferences,
    );

    if (!isTest) {
      const daysInactive = daysInactiveSinceLastSeen(row.last_seen, timezone);
      if (daysInactive !== inactiveDays) {
        skipped += 1;
        continue;
      }
    }

    const local = getUserLocalParts(timezone);
    if (!force && local.hour !== 9) {
      skipped += 1;
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
        skipped += 1;
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

    if (!mail.ok) {
      if (mail.reason === "not_configured") skipped += 1;
      else errors.push(`${email}: ${mail.message}`);
      continue;
    }

    if (!isTest) {
      const { error: logErr } = await supabase.from("email_reminder_log").insert({
        user_id: row.id,
        subscription_id: null,
        reminder_type: reminderType,
        sent_on: sentUtcDay,
      });

      if (logErr) errors.push(`${email}: nosūtīts, žurnāls – ${logErr.message}`);
      else sent += 1;
    } else {
      sent += 1;
    }
  }

  return Response.json({
    success: errors.length === 0,
    sent,
    skipped,
    inactiveDays,
    testMode: isTest,
    errors: errors.slice(0, 20),
  });
}

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/security/cron-auth";
import {
  loadEmailCronContext,
  parseUserLocaleAndTz,
  todayIsoUtc,
  userWantsEmail,
} from "@/lib/cron/email-cron-common";
import { isWeeklySummarySendWindow } from "@/lib/cron/user-local-schedule";
import { todayIsoInTimezone } from "@/lib/subscriptions/due-active";
import {
  buildWeeklySummaryPayload,
  formatWeekRangeLabel,
  getWeekBoundsIso,
} from "@/lib/emails/weekly-summary-email";
import {
  isTransactionalEmailConfigured,
  sendWeeklySummaryEmail,
} from "@/lib/emails/send-transactional";

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!isTransactionalEmailConfigured()) {
    return NextResponse.json({
      success: false,
      message: "RESEND_API_KEY un EMAIL_FROM nav konfigurēti.",
    });
  }

  const ctx = await loadEmailCronContext();
  if ("error" in ctx) {
    return NextResponse.json({ success: false, message: ctx.error }, { status: ctx.status });
  }

  const { supabase, siteUrl, systemName, currency, templatesStore } = ctx;
  const sentUtcDay = todayIsoUtc();

  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, email, display_preferences, email_notification_preferences");

  if (usersErr) {
    return NextResponse.json({ success: false, message: usersErr.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of users ?? []) {
    const email = user.email?.trim();
    if (!email) {
      skipped += 1;
      continue;
    }
    if (!userWantsEmail(user.email_notification_preferences, "weekly")) {
      skipped += 1;
      continue;
    }

    const { locale, timezone, weekStart } = parseUserLocaleAndTz(user.display_preferences);
    if (!isWeeklySummarySendWindow(timezone)) {
      skipped += 1;
      continue;
    }

    const todayIso = todayIsoInTimezone(timezone);

    const { data: already } = await supabase
      .from("email_reminder_log")
      .select("id")
      .eq("user_id", user.id)
      .eq("reminder_type", "weekly_summary")
      .eq("sent_on", sentUtcDay)
      .maybeSingle();

    if (already) {
      skipped += 1;
      continue;
    }

    const { data: subs, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, name, amount, next_payment_date, term_end")
      .eq("user_id", user.id);

    if (subsErr) {
      errors.push(`${email}: ${subsErr.message}`);
      continue;
    }

    const payload = buildWeeklySummaryPayload(
      (subs ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        amount: typeof s.amount === "number" ? s.amount : parseFloat(String(s.amount)),
        next_payment_date: s.next_payment_date,
        term_end: s.term_end,
      })),
      todayIso,
      currency,
      locale,
      weekStart,
    );

    const hasContent =
      payload.overdue.length > 0 ||
      payload.dueThisWeek.length > 0 ||
      payload.upcomingCount > 0;

    if (!hasContent) {
      skipped += 1;
      continue;
    }

    const { startIso, endIso } = getWeekBoundsIso(todayIso, weekStart);
    const weekRangeLabel = formatWeekRangeLabel(startIso, endIso, locale);

    const mail = await sendWeeklySummaryEmail({
      to: email,
      locale,
      systemName,
      siteUrl,
      templatesStore,
      weekRangeLabel,
      payload,
    });

    if (!mail.ok) {
      if (mail.reason === "not_configured") skipped += 1;
      else errors.push(`${email}: ${mail.message}`);
      continue;
    }

    const { error: logErr } = await supabase.from("email_reminder_log").insert({
      user_id: user.id,
      subscription_id: null,
      reminder_type: "weekly_summary",
      sent_on: sentUtcDay,
    });

    if (logErr) errors.push(`${email}: nosūtīts, žurnāls – ${logErr.message}`);
    else sent += 1;
  }

  return NextResponse.json({
    success: errors.length === 0,
    sent,
    skipped,
    errors: errors.slice(0, 20),
  });
}

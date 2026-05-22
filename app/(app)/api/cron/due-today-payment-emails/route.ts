import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/security/cron-auth";
import {
  loadEmailCronContext,
  parseUserLocaleAndTz,
  todayIsoUtc,
  userWantsEmail,
} from "@/lib/cron/email-cron-common";
import { todayIsoInTimezone } from "@/lib/subscriptions/due-active";
import { mapDueTodayRows } from "@/lib/subscriptions/due-today-for-email";
import {
  isTransactionalEmailConfigured,
  sendPaymentDueTodayEmail,
} from "@/lib/emails/send-transactional";
import type { OverdueSubscriptionRow } from "@/lib/subscriptions/overdue-for-email";

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

  const { data: subs, error: subsErr } = await supabase
    .from("subscriptions")
    .select("id, user_id, name, amount, next_payment_date, term_end");

  if (subsErr) {
    return NextResponse.json({ success: false, message: subsErr.message }, { status: 500 });
  }

  const userIds = [...new Set((subs ?? []).map((s) => s.user_id))];
  const usersById = new Map<
    string,
    {
      email: string;
      display_preferences: unknown;
      email_notification_preferences: unknown;
    }
  >();

  if (userIds.length > 0) {
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, email, display_preferences, email_notification_preferences")
      .in("id", userIds);

    if (usersErr) {
      return NextResponse.json({ success: false, message: usersErr.message }, { status: 500 });
    }
    for (const u of users ?? []) {
      usersById.set(u.id, {
        email: u.email,
        display_preferences: u.display_preferences,
        email_notification_preferences: u.email_notification_preferences,
      });
    }
  }

  const joined = (subs ?? []).map((s) => ({
    ...s,
    users: usersById.get(s.user_id) ?? null,
  }));

  const candidates: OverdueSubscriptionRow[] = [];

  for (const uid of userIds) {
    const user = usersById.get(uid);
    if (!user?.email?.trim()) continue;
    if (!userWantsEmail(user.email_notification_preferences, "dueToday")) continue;

    const { timezone } = parseUserLocaleAndTz(user.display_preferences);
    const todayIso = todayIsoInTimezone(timezone);
    const userSubs = joined.filter((s) => s.user_id === uid);
    const rows = mapDueTodayRows(
      userSubs.map((s) => ({
        ...s,
        users: {
          email: user.email,
          display_preferences: user.display_preferences,
        },
      })),
      todayIso,
      currency,
    );
    candidates.push(...rows);
  }

  if (candidates.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      skipped: 0,
      message: "Nav šodienas maksājumu ar ieslēgtiem paziņojumiem.",
    });
  }

  const subIds = candidates.map((c) => c.subscriptionId);
  const { data: sentToday } = await supabase
    .from("email_reminder_log")
    .select("subscription_id")
    .eq("reminder_type", "due_today")
    .eq("sent_on", sentUtcDay)
    .in("subscription_id", subIds);

  const alreadySent = new Set(
    (sentToday ?? []).map((r) => String(r.subscription_id)),
  );

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of candidates) {
    if (alreadySent.has(row.subscriptionId)) {
      skipped += 1;
      continue;
    }
    const mail = await sendPaymentDueTodayEmail({
      row,
      systemName,
      siteUrl,
      templatesStore,
    });
    if (!mail.ok) {
      if (mail.reason === "not_configured") skipped += 1;
      else errors.push(`${row.email}: ${mail.message}`);
      continue;
    }
    const { error: logErr } = await supabase.from("email_reminder_log").insert({
      user_id: row.userId,
      subscription_id: row.subscriptionId,
      reminder_type: "due_today",
      sent_on: sentUtcDay,
    });
    if (logErr) errors.push(`${row.email}: nosūtīts, žurnāls – ${logErr.message}`);
    else sent += 1;
  }

  return NextResponse.json({
    success: errors.length === 0,
    sent,
    skipped,
    errors: errors.slice(0, 20),
  });
}

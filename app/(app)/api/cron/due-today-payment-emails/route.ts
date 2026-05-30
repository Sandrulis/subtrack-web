import { NextResponse } from "next/server";
import {
  applyCronMailSendResult,
  buildCronEmailStatsBody,
  createAuthorizedCronGetRoute,
  logEmailReminderAndCountSent,
} from "@/lib/cron/email-reminder-send";
import {
  buildAdminTestDueTodayRow,
  cronIncludesUser,
  getCronTestUserId,
  isCronAdminTestRun,
} from "@/lib/cron/cron-admin-test";
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

export const GET = createAuthorizedCronGetRoute("due-today-payment-emails", handleGet);

async function handleGet(request: Request) {
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

  const { supabase, siteUrl, systemName, currency, templatesStore, systemDisplayPreferences } =
    ctx;
  const sentUtcDay = todayIsoUtc();
  const testUserId = getCronTestUserId(request);
  const isTest = isCronAdminTestRun(request);

  const { data: subs, error: subsErr } = await supabase
    .from("subscriptions")
    .select("id, user_id, name, amount, next_payment_date, term_end");

  if (subsErr) {
    return NextResponse.json({ success: false, message: subsErr.message }, { status: 500 });
  }

  const filteredSubs = (subs ?? []).filter((s) =>
    cronIncludesUser(String(s.user_id), testUserId),
  );

  let userIds = [...new Set(filteredSubs.map((s) => s.user_id))];
  if (isTest && testUserId && !userIds.includes(testUserId)) {
    userIds = [testUserId];
  }
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

  if (isTest && testUserId && !usersById.has(testUserId)) {
    const { data: testUser, error: testUserErr } = await supabase
      .from("users")
      .select("id, email, display_preferences, email_notification_preferences")
      .eq("id", testUserId)
      .maybeSingle();

    if (testUserErr) {
      return NextResponse.json({ success: false, message: testUserErr.message }, { status: 500 });
    }
    if (testUser) {
      usersById.set(testUser.id, {
        email: testUser.email,
        display_preferences: testUser.display_preferences,
        email_notification_preferences: testUser.email_notification_preferences,
      });
    }
  }

  const joined = filteredSubs.map((s) => ({
    ...s,
    users: usersById.get(s.user_id) ?? null,
  }));

  const candidates: OverdueSubscriptionRow[] = [];

  for (const uid of userIds) {
    const user = usersById.get(uid);
    if (!user?.email?.trim()) continue;
    if (
      !isTest &&
      !userWantsEmail(user.email_notification_preferences, "dueToday")
    ) {
      continue;
    }

    const { timezone } = parseUserLocaleAndTz(
      user.display_preferences,
      systemDisplayPreferences,
    );
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
    if (rows.length > 0) {
      candidates.push(...rows);
    } else if (isTest) {
      candidates.push(
        buildAdminTestDueTodayRow({
          userId: uid,
          email: user.email.trim(),
          todayIso,
          currency,
          displayPreferences: user.display_preferences,
          systemDisplayPreferences,
          subs: userSubs.map((s) => ({
            id: s.id,
            name: s.name,
            amount: s.amount,
          })),
        }),
      );
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      skipped: 0,
      testMode: isTest,
      message: isTest
        ? "Testa lietotājam nav e-pasta vai konta."
        : "Nav šodienas maksājumu ar ieslēgtiem paziņojumiem.",
    });
  }

  const subIds = candidates.map((c) => c.subscriptionId);
  const alreadySent = new Set<string>();
  if (!isTest) {
    const { data: sentToday } = await supabase
      .from("email_reminder_log")
      .select("subscription_id")
      .eq("reminder_type", "due_today")
      .eq("sent_on", sentUtcDay)
      .in("subscription_id", subIds);

    for (const r of sentToday ?? []) {
      alreadySent.add(String(r.subscription_id));
    }
  }

  const counters = { sent: 0, skipped: 0, errors: [] as string[] };

  for (const row of candidates) {    if (alreadySent.has(row.subscriptionId)) {
      counters.skipped += 1;
      continue;
    }
    const mail = await sendPaymentDueTodayEmail({
      row,
      systemName,
      siteUrl,
      templatesStore,
      systemDisplayPreferences,
      userDisplayPreferences: usersById.get(row.userId)?.display_preferences,
    });
    const outcome = applyCronMailSendResult(mail, row.email, counters);
    if (outcome !== "sent_pending_log") continue;

    await logEmailReminderAndCountSent({
      supabase,
      isTest,
      sentUtcDay,
      userId: row.userId,
      subscriptionId: row.subscriptionId,
      reminderType: "due_today",
      email: row.email,
      counters,
    });
  }

  return NextResponse.json(
    buildCronEmailStatsBody({
      errors: counters.errors,
      sent: counters.sent,
      skipped: counters.skipped,
      isTest,
    }),
  );
}

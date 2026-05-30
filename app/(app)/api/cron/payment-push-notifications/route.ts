import { NextResponse } from "next/server";
import { buildPaymentDigestPushCopy } from "@/lib/push/notification-copy";
import { collectPaymentDueAlerts } from "@/lib/push/payment-due-alerts";
import { isWebPushConfigured } from "@/lib/push/vapid-config";
import { sendWebPushToSubscription } from "@/lib/push/send-web-push";
import { todayIsoInTimezone } from "@/lib/subscriptions/due-active";
import {
  createAuthorizedCronGetRoute,
} from "@/lib/cron/email-reminder-send";
import {
  cronIncludesUser,
  getCronTestUserId,
  isCronAdminTestRun,
} from "@/lib/cron/cron-admin-test";
import {
  loadServiceRoleCronContext,
  parseUserLocaleAndTz,
  todayIsoUtc,
} from "@/lib/cron/email-cron-common";
import type { PaymentDueAlert } from "@/lib/push/payment-due-alerts";

export const GET = createAuthorizedCronGetRoute("payment-push-notifications", handleGet);

async function handleGet(request: Request) {
  if (!isWebPushConfigured()) {
    return NextResponse.json({
      success: false,
      message:
        "VAPID atslēgas nav konfigurētas (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT).",
    });
  }

  const ctx = await loadServiceRoleCronContext();
  if ("error" in ctx) {
    return NextResponse.json({ success: false, message: ctx.error }, { status: ctx.status });
  }

  const { supabase, siteUrl, systemName, systemDisplayPreferences } = ctx;
  const sentUtcDay = todayIsoUtc();
  const testUserId = getCronTestUserId(request);
  const isTest = isCronAdminTestRun(request);

  let pushQuery = supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  if (testUserId) {
    pushQuery = pushQuery.eq("user_id", testUserId);
  }

  const { data: pushRows, error: pushErr } = await pushQuery;

  if (pushErr) {
    return NextResponse.json({ success: false, message: pushErr.message }, { status: 500 });
  }

  const byUser = new Map<
    string,
    Array<{ endpoint: string; p256dh: string; auth: string }>
  >();
  for (const row of pushRows ?? []) {
    const uid = row.user_id as string;
    const list = byUser.get(uid) ?? [];
    list.push({
      endpoint: String(row.endpoint),
      p256dh: String(row.p256dh),
      auth: String(row.auth),
    });
    byUser.set(uid, list);
  }

  let sentUsers = 0;
  let skippedNoDue = 0;
  let skippedAlready = 0;
  const errors: string[] = [];

  for (const [userId, subs] of byUser) {
    if (!cronIncludesUser(userId, testUserId)) {
      continue;
    }

    if (!isTest) {
      const { data: already } = await supabase
        .from("push_notification_log")
        .select("id")
        .eq("user_id", userId)
        .eq("reminder_type", "payment_digest")
        .eq("sent_on", sentUtcDay)
        .maybeSingle();

      if (already) {
        skippedAlready += 1;
        continue;
      }
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("display_preferences")
      .eq("id", userId)
      .maybeSingle();

    const { locale, timezone } = parseUserLocaleAndTz(
      userRow?.display_preferences,
      systemDisplayPreferences,
    );
    const todayIso = todayIsoInTimezone(timezone);

    const { data: userSubs, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, name, next_payment_date, term_end")
      .eq("user_id", userId);

    if (subsErr) {
      errors.push(`${userId}: ${subsErr.message}`);
      continue;
    }

    let alerts = collectPaymentDueAlerts(userSubs ?? [], todayIso);
    if (alerts.length === 0 && isTest) {
      const sample: PaymentDueAlert = {
        subscriptionId: "admin-test",
        name: "Netflix (tests)",
        kind: "due_today",
        dueDate: todayIso,
        overdueDays: 0,
      };
      alerts = [sample];
    } else if (alerts.length === 0) {
      skippedNoDue += 1;
      continue;
    }

    const { title, body } = buildPaymentDigestPushCopy(alerts, locale, systemName);
    const payload = {
      title,
      body,
      url: `${siteUrl}/dashboard`,
      tag: `subtrack-payment-${todayIso}`,
      badgeCount: alerts.length,
    };

    let delivered = false;
    for (const device of subs) {
      try {
        await sendWebPushToSubscription(device, payload);
        delivered = true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "push failed";
        if (msg.includes("410") || msg.includes("404") || msg.includes("expired")) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", device.endpoint);
        } else {
          errors.push(`${device.endpoint.slice(0, 40)}…: ${msg}`);
        }
      }
    }

    if (delivered) {
      if (!isTest) {
        const { error: logErr } = await supabase.from("push_notification_log").insert({
          user_id: userId,
          reminder_type: "payment_digest",
          sent_on: sentUtcDay,
        });
        if (logErr) {
          errors.push(`log ${userId}: ${logErr.message}`);
        } else {
          sentUsers += 1;
        }
      } else {
        sentUsers += 1;
      }
    }
  }

  if (isTest && byUser.size === 0) {
    return NextResponse.json({
      success: true,
      sentUsers: 0,
      skippedNoDue: 0,
      skippedAlready: 0,
      testMode: true,
      message: "Testa lietotājam nav reģistrētu PWA push ierīču.",
      errors: [],
    });
  }

  return NextResponse.json({
    success: true,
    sentUsers,
    skippedNoDue,
    skippedAlready,
    testMode: isTest,
    errors: errors.slice(0, 20),
  });
}

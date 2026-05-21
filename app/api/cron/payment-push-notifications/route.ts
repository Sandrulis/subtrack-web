import { NextResponse } from "next/server";
import { buildPaymentDigestPushCopy } from "@/lib/push/notification-copy";
import { collectPaymentDueAlerts } from "@/lib/push/payment-due-alerts";
import { isWebPushConfigured } from "@/lib/push/vapid-config";
import { sendWebPushToSubscription } from "@/lib/push/send-web-push";
import { todayIsoInTimezone } from "@/lib/subscriptions/due-active";
import { getSystemSiteName } from "@/lib/system-settings-public";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
} from "@/lib/user-display-preferences";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  if (auth === `Bearer ${secret}`) return true;
  const q = new URL(request.url).searchParams.get("secret");
  return q === secret;
}

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseLocale(prefs: unknown): string {
  const merged = mergeDisplayPreferences({}, DISPLAY_PREFERENCES_DEFAULTS);
  if (prefs && typeof prefs === "object") {
    const code = String(
      (prefs as Record<string, unknown>).interface_language_code ?? "",
    ).trim();
    if (code) merged.interface_language_code = code;
    const tz = String((prefs as Record<string, unknown>).timezone ?? "").trim();
    if (tz) merged.timezone = tz as typeof merged.timezone;
  }
  return merged.interface_language_code;
}

function parseTimezone(prefs: unknown): string {
  const merged = mergeDisplayPreferences({}, DISPLAY_PREFERENCES_DEFAULTS);
  if (prefs && typeof prefs === "object") {
    const tz = String((prefs as Record<string, unknown>).timezone ?? "").trim();
    if (tz) merged.timezone = tz as typeof merged.timezone;
  }
  return merged.timezone;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json({
      success: false,
      message: "VAPID atslēgas nav konfigurētas (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT).",
    });
  }

  let supabase;
  try {
    supabase = createServiceRoleSupabaseClient();
    if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY nav iestatīts.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Service role nav pieejams.";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const systemName = await getSystemSiteName();
  const sentUtcDay = todayIsoUtc();

  const { data: pushRows, error: pushErr } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

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

    const { data: userRow } = await supabase
      .from("users")
      .select("display_preferences")
      .eq("id", userId)
      .maybeSingle();

    const tz = parseTimezone(userRow?.display_preferences);
    const todayIso = todayIsoInTimezone(tz);
    const locale = parseLocale(userRow?.display_preferences);

    const { data: userSubs, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, name, next_payment_date, term_end")
      .eq("user_id", userId);

    if (subsErr) {
      errors.push(`${userId}: ${subsErr.message}`);
      continue;
    }

    const alerts = collectPaymentDueAlerts(userSubs ?? [], todayIso);
    if (alerts.length === 0) {
      skippedNoDue += 1;
      continue;
    }

    const { title, body } = buildPaymentDigestPushCopy(alerts, locale, systemName);
    const payload = {
      title,
      body,
      url: `${siteUrl}/dashboard`,
      tag: `repazy-payment-${todayIso}`,
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
    }
  }

  return NextResponse.json({
    success: true,
    sentUsers,
    skippedNoDue,
    skippedAlready,
    errors: errors.slice(0, 20),
  });
}

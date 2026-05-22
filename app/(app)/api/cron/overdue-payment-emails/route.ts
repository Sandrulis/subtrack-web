import { NextResponse } from "next/server";
import {
  normalizeStoredEmailTemplates,
  sanitizeEmailTemplatesStore,
} from "@/lib/emails/merge-template-copy";
import { getSystemSiteName } from "@/lib/system-settings-public";
import { sendOverduePaymentEmail, isTransactionalEmailConfigured } from "@/lib/emails/send-transactional";
import {
  mapOverdueRows,
  type OverdueSubscriptionRow,
} from "@/lib/subscriptions/overdue-for-email";
import { authorizeCron } from "@/lib/security/cron-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { DISPLAY_PREFERENCES_DEFAULTS } from "@/lib/user-display-preferences";

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const today = todayIsoUtc();

  let supabase;
  try {
    supabase = createServiceRoleSupabaseClient();
    if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY nav iestatīts.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Service role nav pieejams.";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }

  const [{ data: settings }, { data: emailTplRow }] = await Promise.all([
    supabase
      .from("system_settings")
      .select("system_name, default_display_preferences")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("system_settings_email_templates")
      .select("email_templates")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const systemName = await getSystemSiteName();

  const prefs =
    settings?.default_display_preferences &&
    typeof settings.default_display_preferences === "object"
      ? (settings.default_display_preferences as Record<string, unknown>)
      : {};
  const currency =
    typeof prefs.currency === "string" && prefs.currency.trim()
      ? prefs.currency.trim()
      : DISPLAY_PREFERENCES_DEFAULTS.currency;

  const templatesStore = normalizeStoredEmailTemplates(
    sanitizeEmailTemplatesStore(emailTplRow?.email_templates),
    systemName,
  );

  const { data: subs, error: subsErr } = await supabase
    .from("subscriptions")
    .select("id, user_id, name, amount, next_payment_date")
    .lt("next_payment_date", today);

  if (subsErr) {
    return NextResponse.json(
      { success: false, message: subsErr.message },
      { status: 500 },
    );
  }

  const userIds = [...new Set((subs ?? []).map((s) => s.user_id))];
  const usersById = new Map<
    string,
    { email: string; display_preferences: unknown }
  >();

  if (userIds.length > 0) {
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, email, display_preferences")
      .in("id", userIds);

    if (usersErr) {
      return NextResponse.json(
        { success: false, message: usersErr.message },
        { status: 500 },
      );
    }
    for (const u of users ?? []) {
      usersById.set(u.id, {
        email: u.email,
        display_preferences: u.display_preferences,
      });
    }
  }

  const joined = (subs ?? []).map((s) => ({
    ...s,
    users: usersById.get(s.user_id) ?? null,
  }));

  const overdue = mapOverdueRows(
    joined as Parameters<typeof mapOverdueRows>[0],
    today,
    currency,
  );

  if (overdue.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      skipped: 0,
      message: "Nav kavētu maksājumu.",
    });
  }

  const subIds = overdue.map((o) => o.subscriptionId);
  const { data: sentToday } = await supabase
    .from("email_reminder_log")
    .select("subscription_id")
    .eq("reminder_type", "overdue")
    .eq("sent_on", today)
    .in("subscription_id", subIds);

  const alreadySent = new Set(
    (sentToday ?? []).map((r) => String(r.subscription_id)),
  );

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of overdue) {
    if (alreadySent.has(row.subscriptionId)) {
      skipped += 1;
      continue;
    }
    const result = await sendOverduePayment(row, systemName, siteUrl, templatesStore, supabase);
    if (result === "sent") sent += 1;
    else if (result === "skipped") skipped += 1;
    else errors.push(result);
  }

  return NextResponse.json({
    success: errors.length === 0,
    sent,
    skipped,
    errors: errors.slice(0, 20),
  });
}

async function sendOverduePayment(
  row: OverdueSubscriptionRow,
  systemName: string,
  siteUrl: string,
  templatesStore: ReturnType<typeof sanitizeEmailTemplatesStore>,
  supabase: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>,
): Promise<"sent" | "skipped" | string> {
  const mail = await sendOverduePaymentEmail({
    row,
    systemName,
    siteUrl,
    templatesStore,
  });

  if (!mail.ok) {
    if (mail.reason === "not_configured") return "skipped";
    return `${row.email}: ${mail.message}`;
  }

  const today = todayIsoUtc();
  const { error: logErr } = await supabase.from("email_reminder_log").insert({
    user_id: row.userId,
    subscription_id: row.subscriptionId,
    reminder_type: "overdue",
    sent_on: today,
  });

  if (logErr) {
    return `${row.email}: nosūtīts, bet žurnāls neizdevās – ${logErr.message}`;
  }

  return "sent";
}

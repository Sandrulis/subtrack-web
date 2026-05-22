import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/security/cron-auth";
import {
  loadEmailCronContext,
  parseUserLocaleAndTz,
  todayIsoUtc,
  userWantsEmail,
} from "@/lib/cron/email-cron-common";
import { isCronForceRun } from "@/lib/cron/cron-force-query";
import { getUserLocalParts } from "@/lib/cron/user-local-schedule";
import {
  getProTrialEndInstant,
  isProTrialActive,
  normalizeProTrialConfig,
} from "@/lib/auth/pro-trial-access";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  formatDateForDisplayPreferences,
  mergeDisplayPreferences,
  sanitizeDisplayPreferencesPartial,
} from "@/lib/user-display-preferences";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import {
  isTransactionalEmailConfigured,
  sendTrialEndingEmail,
} from "@/lib/emails/send-transactional";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function trialReminderType(daysRemaining: number): "trial_end_3d" | "trial_end_1d" | "trial_end_0d" | null {
  if (daysRemaining === 3) return "trial_end_3d";
  if (daysRemaining === 1) return "trial_end_1d";
  if (daysRemaining === 0) return "trial_end_0d";
  return null;
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

  const ctx = await loadEmailCronContext();
  if ("error" in ctx) {
    return NextResponse.json({ success: false, message: ctx.error }, { status: ctx.status });
  }

  const { supabase, siteUrl, systemName, templatesStore } = ctx;
  const sentUtcDay = todayIsoUtc();

  const { data: settings } = await supabase
    .from("system_settings")
    .select("pro_trial_enabled, pro_trial_days, paid_plan_enabled")
    .eq("id", 1)
    .maybeSingle();

  const trialConfig = normalizeProTrialConfig(settings);
  const paidPlanEnabled = settings?.paid_plan_enabled === true;

  if (!trialConfig.enabled || !paidPlanEnabled) {
    return NextResponse.json({
      success: true,
      sent: 0,
      skipped: 0,
      message: "Pro izmēģinājums nav ieslēgts.",
    });
  }

  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select(
      "id, email, display_preferences, email_notification_preferences, paid_plan_active, pro_vip, pro_trial_used, pro_trial_started_at",
    );

  if (usersErr) {
    return NextResponse.json({ success: false, message: usersErr.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of users ?? []) {
    const email = row.email?.trim();
    if (!email) {
      skipped += 1;
      continue;
    }
    if (!userWantsEmail(row.email_notification_preferences, "trialEnd")) {
      skipped += 1;
      continue;
    }

    const userFields = {
      paidPlanActive: row.paid_plan_active === true,
      proVip: row.pro_vip === true,
      proTrialUsed: row.pro_trial_used === true,
      proTrialStartedAt: row.pro_trial_started_at ?? null,
    };

    if (!isProTrialActive(userFields, trialConfig, { paidPlanEnabled })) {
      skipped += 1;
      continue;
    }

    if (!userFields.proTrialStartedAt) {
      skipped += 1;
      continue;
    }

    const started = new Date(userFields.proTrialStartedAt);
    const totalMs = trialConfig.days * MS_PER_DAY;
    const remainingMs = Math.max(0, started.getTime() + totalMs - Date.now());
    const daysRemaining = Math.max(0, Math.ceil(remainingMs / MS_PER_DAY));

    const reminderType = trialReminderType(daysRemaining);
    if (!reminderType) {
      skipped += 1;
      continue;
    }

    const { timezone } = parseUserLocaleAndTz(row.display_preferences);
    const force = isCronForceRun(request);
    const local = getUserLocalParts(timezone);
    if (!force && local.hour !== 9) {
      skipped += 1;
      continue;
    }

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

    const { locale } = parseUserLocaleAndTz(row.display_preferences);
    const prefs = mergeDisplayPreferences(
      sanitizeDisplayPreferencesPartial(row.display_preferences),
      DISPLAY_PREFERENCES_DEFAULTS,
    );
    const endInstant = getProTrialEndInstant(userFields.proTrialStartedAt, trialConfig.days);
    const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
    const trialEndDateFormatted = endInstant
      ? formatDateForDisplayPreferences(
          new Date(endInstant.getTime() - 1),
          prefs,
          intlLocale,
        )
      : "";

    const mail = await sendTrialEndingEmail({
      to: email,
      locale,
      systemName,
      siteUrl,
      templatesStore,
      trialDaysRemaining: daysRemaining,
      trialEndDateFormatted,
    });

    if (!mail.ok) {
      if (mail.reason === "not_configured") skipped += 1;
      else errors.push(`${email}: ${mail.message}`);
      continue;
    }

    const { error: logErr } = await supabase.from("email_reminder_log").insert({
      user_id: row.id,
      subscription_id: null,
      reminder_type: reminderType,
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

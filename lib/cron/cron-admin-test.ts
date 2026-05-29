import {
  buildWeeklySummaryPayload,
  formatWeekdayDueLabel,
  type WeeklySummaryPayload,
  type WeeklySummarySubscription,
} from "@/lib/emails/weekly-summary-email";
import { normalizeEmailLocale, type EmailPreviewLocale } from "@/lib/emails/template-types";
import { formatAmountForEmail, type OverdueSubscriptionRow } from "@/lib/subscriptions/overdue-for-email";
import { parseUserLocaleAndTz } from "@/lib/cron/email-cron-common";
import type { DisplayPreferences } from "@/lib/user-display-preferences";

/** Admin `/admin/cron-jobs` – tikai viens lietotājs (ne masveida cron). */
export function getCronTestUserId(request: Request): string | null {
  try {
    const id = new URL(request.url).searchParams.get("testUserId")?.trim();
    return id || null;
  } catch {
    return null;
  }
}

export function isCronAdminTestRun(request: Request): boolean {
  return getCronTestUserId(request) !== null;
}

export function cronIncludesUser(userId: string, testUserId: string | null): boolean {
  return !testUserId || userId === testUserId;
}

export function buildAdminTestDueTodayRow(input: {
  userId: string;
  email: string;
  todayIso: string;
  currency: string;
  displayPreferences: unknown;
  systemDisplayPreferences: DisplayPreferences;
  subs: Array<{ id: string; name: string; amount: number | string }>;
}): OverdueSubscriptionRow {
  const { locale } = parseUserLocaleAndTz(
    input.displayPreferences,
    input.systemDisplayPreferences,
  );
  const sub = input.subs[0];
  const rawAmount = sub
    ? typeof sub.amount === "number"
      ? sub.amount
      : parseFloat(String(sub.amount))
    : 9.99;
  const amount = Number.isFinite(rawAmount) ? rawAmount : 9.99;

  return {
    subscriptionId: sub?.id ?? "admin-test",
    userId: input.userId,
    email: input.email,
    paymentName: sub?.name?.trim() || "Netflix (tests)",
    amount,
    currency: input.currency,
    nextPaymentDate: input.todayIso,
    overdueDays: 0,
    locale,
  };
}

export function buildAdminTestWeeklyPayload(input: {
  subs: WeeklySummarySubscription[];
  todayIso: string;
  currency: string;
  locale: EmailPreviewLocale;
  weekStart: "monday" | "sunday";
}): WeeklySummaryPayload {
  const fromData = buildWeeklySummaryPayload(
    input.subs,
    input.todayIso,
    input.currency,
    input.locale,
    input.weekStart,
  );
  const hasContent =
    fromData.overdue.length > 0 ||
    fromData.dueThisWeek.length > 0 ||
    fromData.upcomingCount > 0;
  if (hasContent) return fromData;

  const sub = input.subs[0];
  const rawAmount = sub
    ? typeof sub.amount === "number"
      ? sub.amount
      : parseFloat(String(sub.amount))
    : 12.99;
  const amount = Number.isFinite(rawAmount) ? rawAmount : 12.99;
  const amountFormatted = formatAmountForEmail(amount, input.currency, input.locale);
  const name = sub?.name?.trim() || "Spotify (tests)";

  return {
    overdue: [],
    dueThisWeek: [
      {
        name,
        amountFormatted,
        dueLabel: formatWeekdayDueLabel(input.todayIso, input.locale, "UTC"),
      },
    ],
    upcomingCount: 0,
    upcomingTotalFormatted: formatAmountForEmail(0, input.currency, input.locale),
  };
}

export function adminTestTrialDaysRemaining(): number {
  return 3;
}

export function adminTestTrialEndDateFormatted(
  displayPreferences: unknown,
  systemDisplayPreferences: DisplayPreferences,
): string {
  const end = new Date();
  end.setDate(end.getDate() + 3);
  const { locale } = parseUserLocaleAndTz(displayPreferences, systemDisplayPreferences);
  const bcp = normalizeEmailLocale(locale);
  try {
    return new Intl.DateTimeFormat(bcp === "lv" ? "lv-LV" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(end);
  } catch {
    return end.toISOString().slice(0, 10);
  }
}

export function adminTestLastSeenFormatted(
  displayPreferences: unknown,
  systemDisplayPreferences: DisplayPreferences,
): string {
  const { locale } = parseUserLocaleAndTz(displayPreferences, systemDisplayPreferences);
  const bcp = normalizeEmailLocale(locale);
  try {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return new Intl.DateTimeFormat(bcp === "lv" ? "lv-LV" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() - 7);
    return fallback.toISOString().slice(0, 10);
  }
}

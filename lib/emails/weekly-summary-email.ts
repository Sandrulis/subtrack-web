import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";
import {
  isSubscriptionDueActive,
  normalizeSubscriptionDateIso,
  overdueDays,
} from "@/lib/subscriptions/due-active";
import {
  formatAmountForEmail,
  formatDueDateForEmail,
} from "@/lib/subscriptions/overdue-for-email";
import { normalizeEmailLocale, type EmailPreviewLocale } from "./template-types";

const KEYS = {
  sectionOverdue: "email.weekly.section_overdue",
  sectionOverdueAct: "email.weekly.section_overdue_act",
  sectionDueWeek: "email.weekly.section_due_week",
  sectionUpcoming: "email.weekly.section_upcoming",
  upcomingTotal: "email.weekly.upcoming_total",
  lineOverdue: "email.weekly.line_overdue",
  lineDueWeek: "email.weekly.line_due_week",
  unsubscribe: "email.weekly.unsubscribe",
} as const;

function t(locale: string, key: string, vars?: Record<string, string | number>): string {
  let text = pickFallbackPhrase(key, locale) ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

const INTL_LOCALE: Record<EmailPreviewLocale, string> = {
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-PT",
  lv: "lv-LV",
  ru: "ru-RU",
};

export type WeeklySummarySubscription = {
  id: string;
  name: string;
  amount: number;
  next_payment_date: string;
  term_end?: string | null;
};

export type WeeklySummaryPayload = {
  overdue: Array<{ name: string; amountFormatted: string; overdueDays: number }>;
  dueThisWeek: Array<{ name: string; amountFormatted: string; dueLabel: string }>;
  upcomingCount: number;
  upcomingTotalFormatted: string;
};

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Pirmdiena–svētdiena (ISO) atbilstoši `weekStart`. */
export function getWeekBoundsIso(
  todayIso: string,
  weekStart: "monday" | "sunday",
): { startIso: string; endIso: string } {
  const ref = new Date(`${todayIso}T12:00:00Z`);
  const dow = ref.getUTCDay();
  const offsetToStart =
    weekStart === "monday" ? (dow === 0 ? 6 : dow - 1) : dow;
  const start = addDaysIso(todayIso, -offsetToStart);
  const end = addDaysIso(start, 6);
  return { startIso: start, endIso: end };
}

export function formatWeekRangeLabel(
  startIso: string,
  endIso: string,
  locale: EmailPreviewLocale,
): string {
  const bcp = INTL_LOCALE[locale] ?? "en-GB";
  try {
    const start = new Date(`${startIso}T12:00:00Z`);
    const end = new Date(`${endIso}T12:00:00Z`);
    const dayFmt = new Intl.DateTimeFormat(bcp, { day: "numeric" });
    const monthYearFmt = new Intl.DateTimeFormat(bcp, { month: "long", year: "numeric" });
    return `${dayFmt.format(start)}–${dayFmt.format(end)} ${monthYearFmt.format(end)}`;
  } catch {
    return `${startIso}–${endIso}`;
  }
}

export function formatWeekdayDueLabel(
  dueIso: string,
  locale: EmailPreviewLocale,
  timezone: string,
): string {
  const bcp = INTL_LOCALE[locale] ?? "en-GB";
  try {
    const d = new Date(`${dueIso}T12:00:00Z`);
    const weekday = new Intl.DateTimeFormat(bcp, { weekday: "long", timeZone: "UTC" }).format(d);
    const datePart = new Intl.DateTimeFormat(bcp, {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(d);
    void timezone;
    return `${weekday} ${datePart}`;
  } catch {
    return dueIso;
  }
}

export function buildWeeklySummaryPayload(
  subs: WeeklySummarySubscription[],
  todayIso: string,
  currency: string,
  locale: EmailPreviewLocale,
  weekStart: "monday" | "sunday",
): WeeklySummaryPayload {
  const ref = new Date(`${todayIso}T00:00:00`);
  const { startIso, endIso } = getWeekBoundsIso(todayIso, weekStart);
  const upcomingEnd = addDaysIso(todayIso, 30);

  const overdue: WeeklySummaryPayload["overdue"] = [];
  const dueThisWeek: WeeklySummaryPayload["dueThisWeek"] = [];
  let upcomingSum = 0;
  let upcomingCount = 0;

  for (const s of subs) {
    const due = normalizeSubscriptionDateIso(s.next_payment_date);
    if (!due) continue;
    if (!isSubscriptionDueActive(due, s.term_end ?? "", ref)) continue;
    const amount =
      typeof s.amount === "number" ? s.amount : parseFloat(String(s.amount));
    if (!Number.isFinite(amount)) continue;
    const amountFormatted = formatAmountForEmail(amount, currency, locale);

    if (due < todayIso) {
      overdue.push({
        name: s.name.trim() || "Payment",
        amountFormatted,
        overdueDays: overdueDays(due, todayIso),
      });
    } else if (due >= startIso && due <= endIso) {
      dueThisWeek.push({
        name: s.name.trim() || "Payment",
        amountFormatted,
        dueLabel: formatWeekdayDueLabel(due, locale, "UTC"),
      });
    } else if (due > endIso && due <= upcomingEnd) {
      upcomingSum += amount;
      upcomingCount += 1;
    }
  }

  return {
    overdue,
    dueThisWeek,
    upcomingCount,
    upcomingTotalFormatted: formatAmountForEmail(upcomingSum, currency, locale),
  };
}

function escHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sectionBlock(title: string, lines: string[]): string {
  if (lines.length === 0) return "";
  const items = lines
    .map(
      (line) =>
        `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#1e1e2e;">${line}</p>`,
    )
    .join("");
  return `<div style="margin-bottom:22px;">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e1e2e;">${escHtml(title)}</h2>
    ${items}
  </div>`;
}

export function buildWeeklySummarySectionsHtml(
  payload: WeeklySummaryPayload,
  locale: EmailPreviewLocale,
): string {
  const loc = locale;
  const overdueLines = payload.overdue.map((row) =>
    t(loc, KEYS.lineOverdue, {
      name: row.name,
      amount: row.amountFormatted,
      days: row.overdueDays,
    }),
  );
  const weekLines = payload.dueThisWeek.map((row) =>
    t(loc, KEYS.lineDueWeek, {
      name: row.name,
      amount: row.amountFormatted,
      when: row.dueLabel,
    }),
  );

  const parts: string[] = [];
  if (overdueLines.length > 0) {
    parts.push(
      sectionBlock(
        `${t(loc, KEYS.sectionOverdue)} – ${t(loc, KEYS.sectionOverdueAct)}`,
        overdueLines.map((l) => `🔴 ${l}`),
      ),
    );
  }
  if (weekLines.length > 0) {
    parts.push(sectionBlock(t(loc, KEYS.sectionDueWeek), weekLines.map((l) => `🟡 ${l}`)));
  }
  if (payload.upcomingCount > 0) {
    parts.push(
      `<div style="margin-bottom:8px;">
        <h2 style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1e1e2e;">${escHtml(t(loc, KEYS.sectionUpcoming))}</h2>
        <p style="margin:0;font-size:15px;line-height:1.5;color:#1e1e2e;">${escHtml(
          t(loc, KEYS.upcomingTotal, {
            total: payload.upcomingTotalFormatted,
            count: payload.upcomingCount,
          }),
        )}</p>
      </div>`,
    );
  }
  return parts.join("");
}

export function buildWeeklyUnsubscribeFooterHtml(
  locale: EmailPreviewLocale,
  siteUrl: string,
): string {
  const base = siteUrl.replace(/\/$/, "");
  const label = t(locale, KEYS.unsubscribe);
  const href = `${base}/email-notifications`;
  return `<a href="${escHtml(href)}" style="color:#64748b;text-decoration:underline;">${escHtml(label)}</a>`;
}

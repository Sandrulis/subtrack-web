import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";
import {
  formatAmountForEmail,
  type OverdueSubscriptionRow,
} from "@/lib/subscriptions/overdue-for-email";
import { normalizeEmailLocale, type EmailPreviewLocale } from "./template-types";

const KEYS = {
  sectionTitle: "email.due_today.section_title",
  line: "email.due_today.line",
  total: "email.due_today.total",
  subjectPayments: "email.due_today.subject_payments",
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

export type DueTodayDigestItem = {
  name: string;
  amountFormatted: string;
};

export type DueTodayDigestPayload = {
  items: DueTodayDigestItem[];
  totalFormatted: string;
  paymentCount: number;
};

export function buildDueTodayDigestPayload(
  rows: OverdueSubscriptionRow[],
): DueTodayDigestPayload {
  let total = 0;
  const currency = rows[0]?.currency ?? "EUR";
  const locale = rows[0]?.locale ?? "en";

  const items: DueTodayDigestItem[] = rows.map((row) => {
    total += row.amount;
    return {
      name: row.paymentName,
      amountFormatted: formatAmountForEmail(row.amount, row.currency, row.locale),
    };
  });

  return {
    items,
    paymentCount: items.length,
    totalFormatted: formatAmountForEmail(total, currency, locale),
  };
}

export function buildDueTodayPaymentSummaryLabel(
  rows: OverdueSubscriptionRow[],
  locale: EmailPreviewLocale,
): string {
  if (rows.length === 1) {
    return rows[0]!.paymentName;
  }
  const loc = normalizeEmailLocale(locale);
  return t(loc, KEYS.subjectPayments, { count: rows.length });
}

function escHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildDueTodayDigestSectionsHtml(
  payload: DueTodayDigestPayload,
  locale: EmailPreviewLocale,
): string {
  const loc = normalizeEmailLocale(locale);
  const lines = payload.items.map((row) =>
    t(loc, KEYS.line, { name: row.name, amount: row.amountFormatted }),
  );

  const items = lines
    .map(
      (line) =>
        `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#1e1e2e;">${escHtml(line)}</p>`,
    )
    .join("");

  const totalLine = escHtml(
    t(loc, KEYS.total, { total: payload.totalFormatted, count: payload.paymentCount }),
  );

  return `<div style="margin-bottom:8px;">
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e1e2e;">${escHtml(t(loc, KEYS.sectionTitle))}</h2>
    ${items}
    <p style="margin:12px 0 0;font-size:15px;line-height:1.5;font-weight:700;color:#1e1e2e;">${totalLine}</p>
  </div>`;
}

export function buildAdminTestDueTodayDigestPayload(
  locale: EmailPreviewLocale,
  currency: string,
): DueTodayDigestPayload {
  const loc = normalizeEmailLocale(locale);
  const items: DueTodayDigestItem[] = [
    {
      name: "Netflix",
      amountFormatted: formatAmountForEmail(12.99, currency, loc),
    },
    {
      name: "Spotify",
      amountFormatted: formatAmountForEmail(9.99, currency, loc),
    },
    {
      name: "Phone bill",
      amountFormatted: formatAmountForEmail(30.5, currency, loc),
    },
  ];
  return {
    items,
    paymentCount: items.length,
    totalFormatted: formatAmountForEmail(12.99 + 9.99 + 30.5, currency, loc),
  };
}

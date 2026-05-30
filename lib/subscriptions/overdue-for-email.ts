import type { EmailPreviewLocale } from "@/lib/emails/template-types";
import { parseInterfaceLocale } from "@/lib/subscriptions/parse-interface-locale";

export type OverdueSubscriptionRow = {
  subscriptionId: string;
  userId: string;
  email: string;
  paymentName: string;
  amount: number;
  currency: string;
  nextPaymentDate: string;
  overdueDays: number;
  locale: EmailPreviewLocale;
};

function daysBetween(dueIso: string, todayIso: string): number {
  const due = new Date(`${dueIso}T12:00:00Z`).getTime();
  const today = new Date(`${todayIso}T12:00:00Z`).getTime();
  return Math.max(1, Math.floor((today - due) / 86400000));
}

const AMOUNT_LOCALE: Record<EmailPreviewLocale, string> = {
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-PT",
  lv: "lv-LV",
  ru: "ru-RU",
};

export function formatAmountForEmail(
  amount: number,
  currency: string,
  locale: EmailPreviewLocale = "lv",
): string {
  const cur = currency.trim().toUpperCase() || "EUR";
  try {
    return new Intl.NumberFormat(AMOUNT_LOCALE[locale] ?? "en-GB", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${cur}`;
  }
}

export function formatDueDateForEmail(
  dueIso: string,
  locale: EmailPreviewLocale,
): string {
  const loc = AMOUNT_LOCALE[locale] ?? "en-GB";
  try {
    return new Intl.DateTimeFormat(loc, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(`${dueIso}T12:00:00Z`));
  } catch {
    return dueIso;
  }
}

type RawSubRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number | string;
  next_payment_date: string;
  users: {
    email: string;
    display_preferences: unknown;
  } | null;
};

export function mapOverdueRows(
  rows: RawSubRow[],
  todayIso: string,
  defaultCurrency: string,
): OverdueSubscriptionRow[] {
  const out: OverdueSubscriptionRow[] = [];
  for (const row of rows) {
    const email = row.users?.email?.trim();
    if (!email) continue;
    const due = String(row.next_payment_date).slice(0, 10);
    if (!due || due >= todayIso) continue;
    const locale = parseInterfaceLocale(row.users?.display_preferences);
    const amount =
      typeof row.amount === "number" ? row.amount : parseFloat(String(row.amount));
    if (!Number.isFinite(amount)) continue;
    out.push({
      subscriptionId: row.id,
      userId: row.user_id,
      email,
      paymentName: row.name.trim() || "Maksājums",
      amount,
      currency: defaultCurrency,
      nextPaymentDate: due,
      overdueDays: daysBetween(due, todayIso),
      locale,
    });
  }
  return out;
}

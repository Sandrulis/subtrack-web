import {
  isSubscriptionDueActive,
  normalizeSubscriptionDateIso,
} from "@/lib/subscriptions/due-active";
import {
  formatAmountForEmail,
  formatDueDateForEmail,
  type OverdueSubscriptionRow,
} from "@/lib/subscriptions/overdue-for-email";
import { parseInterfaceLocale } from "@/lib/subscriptions/parse-interface-locale";

type RawSubRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number | string;
  next_payment_date: string;
  term_end?: string | null;
  users: {
    email: string;
    display_preferences: unknown;
    email_notification_preferences?: unknown;
  } | null;
};

export function mapDueTodayRows(
  rows: RawSubRow[],
  todayIso: string,
  defaultCurrency: string,
): OverdueSubscriptionRow[] {
  const ref = new Date(`${todayIso}T00:00:00`);
  const out: OverdueSubscriptionRow[] = [];

  for (const row of rows) {
    const email = row.users?.email?.trim();
    if (!email) continue;
    const due = normalizeSubscriptionDateIso(row.next_payment_date);
    if (!due || due !== todayIso) continue;
    if (!isSubscriptionDueActive(due, row.term_end ?? "", ref)) continue;

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
      overdueDays: 0,
      locale,
    });
  }
  return out;
}

export { formatAmountForEmail, formatDueDateForEmail };

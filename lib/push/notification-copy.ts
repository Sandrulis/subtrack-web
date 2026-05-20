import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";
import type { PaymentDueAlert } from "@/lib/push/payment-due-alerts";

const PUSH_KEYS = {
  title: "push.notification.title",
  bodyOverdueOnly: "push.notification.body_overdue_only",
  bodyTodayOnly: "push.notification.body_today_only",
  bodyBoth: "push.notification.body_both",
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

export function buildPaymentDigestPushCopy(
  alerts: PaymentDueAlert[],
  locale: string,
  systemName: string,
): { title: string; body: string } {
  const overdue = alerts.filter((a) => a.kind === "overdue");
  const today = alerts.filter((a) => a.kind === "due_today");

  const title = t(locale, PUSH_KEYS.title, { name: systemName });

  let body: string;
  if (overdue.length > 0 && today.length > 0) {
    body = t(locale, PUSH_KEYS.bodyBoth, {
      overdue: overdue.length,
      today: today.length,
    });
  } else if (overdue.length > 0) {
    body = t(locale, PUSH_KEYS.bodyOverdueOnly, { count: overdue.length });
  } else {
    body = t(locale, PUSH_KEYS.bodyTodayOnly, { count: today.length });
  }

  const names = alerts
    .slice(0, 3)
    .map((a) => a.name)
    .join(", ");
  if (names) {
    body = `${body} – ${names}`;
    if (alerts.length > 3) body += "…";
  }

  return { title, body };
}

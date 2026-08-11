import {
  isSubscriptionDueActive,
  normalizeSubscriptionDateIso,
} from "@/lib/subscriptions/due-active";

export type CalendarDueSubInput = {
  date?: string | null;
  termEnd?: string | null;
  category?: string | null;
  loanPayments?: Array<{ date?: string | null; paidOn?: string | null }> | null;
};

function isPrivateLoan(s: CalendarDueSubInput): boolean {
  return String(s.category ?? "").trim().toLowerCase() === "private_loan";
}

/**
 * SSR kalendāra pirmā mēneša due skaitītāji (vienkāršots):
 * - nākamais maksājuma datums, ja tas ir skatītajā mēnesī;
 * - privātajam aizdevumam – neapmaksātie grafika datumi mēnesī.
 * Pilnais periodu paplašinājums paliek FS `subscriptionDueDatesInMonth` pēc boot.
 */
export function buildSsrDueCountByDay(
  subscriptions: CalendarDueSubInput[],
  y: number,
  m: number,
): Record<number, number> {
  const counts: Record<number, number> = {};
  const monthEnd = new Date(y, m + 1, 0);
  monthEnd.setHours(0, 0, 0, 0);

  for (const s of subscriptions) {
    if (isPrivateLoan(s)) {
      const payments = Array.isArray(s.loanPayments) ? s.loanPayments : [];
      for (const lp of payments) {
        if (!lp || lp.paidOn || !lp.date) continue;
        const iso = normalizeSubscriptionDateIso(lp.date);
        if (!iso) continue;
        const d = new Date(`${iso}T00:00:00`);
        if (Number.isNaN(d.getTime())) continue;
        if (d.getFullYear() === y && d.getMonth() === m) {
          const day = d.getDate();
          counts[day] = (counts[day] ?? 0) + 1;
        }
      }
      continue;
    }

    const dueIso = normalizeSubscriptionDateIso(s.date);
    if (!dueIso) continue;
    if (!isSubscriptionDueActive(dueIso, String(s.termEnd ?? ""), monthEnd)) {
      continue;
    }
    const d = new Date(`${dueIso}T00:00:00`);
    if (Number.isNaN(d.getTime())) continue;
    if (d.getFullYear() !== y || d.getMonth() !== m) continue;
    const day = d.getDate();
    counts[day] = (counts[day] ?? 0) + 1;
  }

  return counts;
}

export function buildSsrPaidDaySet(
  paidCalendarDays: Record<string, number> | undefined,
  y: number,
  m: number,
): Set<number> {
  const out = new Set<number>();
  if (!paidCalendarDays) return out;
  const prefix = `${y}-${String(m + 1).padStart(2, "0")}-`;
  for (const [iso, n] of Object.entries(paidCalendarDays)) {
    if (!iso.startsWith(prefix) || !(n > 0)) continue;
    const day = Number.parseInt(iso.slice(8, 10), 10);
    if (day >= 1 && day <= 31) out.add(day);
  }
  return out;
}

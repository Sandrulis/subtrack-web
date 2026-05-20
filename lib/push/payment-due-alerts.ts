import {
  isSubscriptionDueActive,
  normalizeSubscriptionDateIso,
  overdueDays,
} from "@/lib/subscriptions/due-active";

export type PaymentDueAlertKind = "overdue" | "due_today";

export type PaymentDueAlert = {
  subscriptionId: string;
  name: string;
  kind: PaymentDueAlertKind;
  dueDate: string;
  overdueDays: number;
};

export type SubscriptionDueInput = {
  id: string;
  name: string;
  next_payment_date: string;
  term_end?: string | null;
};

/** Kavētie + šodien (bez gaidāmo 7 dienu – kā lietotāja prasība). */
export function collectPaymentDueAlerts(
  subs: SubscriptionDueInput[],
  todayIso: string,
): PaymentDueAlert[] {
  const ref = new Date(`${todayIso}T00:00:00`);
  const out: PaymentDueAlert[] = [];

  for (const s of subs) {
    const due = normalizeSubscriptionDateIso(s.next_payment_date);
    if (!due) continue;
    const termEnd = s.term_end ?? "";
    if (!isSubscriptionDueActive(due, termEnd, ref)) continue;

    if (due < todayIso) {
      out.push({
        subscriptionId: s.id,
        name: s.name.trim() || "Maksājums",
        kind: "overdue",
        dueDate: due,
        overdueDays: overdueDays(due, todayIso),
      });
    } else if (due === todayIso) {
      out.push({
        subscriptionId: s.id,
        name: s.name.trim() || "Maksājums",
        kind: "due_today",
        dueDate: due,
        overdueDays: 0,
      });
    }
  }

  out.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "overdue" ? -1 : 1;
    return a.dueDate.localeCompare(b.dueDate);
  });
  return out;
}

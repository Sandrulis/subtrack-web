/** Privāta aizdevuma maksājumu grafiks un atvasinātie lauki (`subscriptions`). */

export const PRIVATE_LOAN_CATEGORY_KEY = "private_loan";

export function isPrivateLoanCategoryKey(category: unknown): boolean {
  return String(category ?? "").trim() === PRIVATE_LOAN_CATEGORY_KEY;
}

export function subscriptionIsPrivateLoan(row: {
  is_private_loan?: boolean;
  category?: string | null;
}): boolean {
  return row.is_private_loan === true || isPrivateLoanCategoryKey(row.category);
}

export type LoanPaymentClient = {
  id: number;
  date: string;
  amount: number;
  paidOn: string;
};

export type LoanPaymentDb = {
  id: number;
  date: string;
  amount: number;
  paidOn: string | null;
};

export function resolvePrivateLoanScheduledAmount(
  row: {
    next_payment_date?: string | null;
    loan_payments?: unknown;
    is_dynamic_amount?: boolean;
    due_amount_override?: unknown;
    due_amount_override_for?: unknown;
  },
  paidOnIso: string,
): number {
  const due = normalizeIsoDate(row.next_payment_date);
  const overrideFor = normalizeIsoDate(row.due_amount_override_for);
  if (
    due &&
    overrideFor === due &&
    row.due_amount_override != null &&
    row.due_amount_override !== ""
  ) {
    const overrideAmt = parseAmount(row.due_amount_override);
    if (Number.isFinite(overrideAmt)) return overrideAmt;
  }
  const payments = coerceLoanPaymentsFromDb(row.loan_payments);
  const match =
    payments.find((p) => p.date === due && !p.paidOn) ??
    payments.find((p) => p.date === due);
  if (!match) return 0;
  const amt = parseAmount(match.amount);
  return Number.isFinite(amt) ? amt : 0;
}

function normalizeIsoDate(raw: unknown): string {
  const s = String(raw ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

function parseAmount(raw: unknown): number {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export function coerceLoanPaymentsFromDb(raw: unknown): LoanPaymentClient[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      return { id: index + 1, date: "", amount: 0, paidOn: "" };
    }
    const o = item as Record<string, unknown>;
    const idRaw = o.id;
    const id =
      typeof idRaw === "number" && !Number.isNaN(idRaw)
        ? idRaw
        : typeof idRaw === "string" && /^\d+$/.test(idRaw)
          ? parseInt(idRaw, 10)
          : index + 1;
    const amountNum = parseAmount(o.amount);
    const paidOn = normalizeIsoDate(o.paidOn ?? o.paid_on);
    return {
      id,
      date: normalizeIsoDate(o.date),
      amount: Number.isFinite(amountNum) ? amountNum : 0,
      paidOn,
    };
  });
}

function loanPaymentRowHasContent(row: LoanPaymentDb): boolean {
  return !!(row.date || (Number.isFinite(row.amount) && row.amount > 0));
}

export function normalizeLoanPaymentsForDb(
  raw: unknown,
):
  | { ok: false; message: string }
  | { ok: true; payments: LoanPaymentDb[] } {
  const mapped = coerceLoanPaymentsFromDb(raw).map((p) => ({
    id: p.id,
    date: p.date,
    amount: p.amount,
    paidOn: p.paidOn || null,
  }));

  const filtered = mapped.filter(loanPaymentRowHasContent);

  for (const row of filtered) {
    if (!row.date) {
      return { ok: false, message: "Each loan payment must have a date" };
    }
    if (!Number.isFinite(row.amount) || row.amount <= 0) {
      return { ok: false, message: "Each loan payment must have a positive amount" };
    }
  }

  filtered.sort((a, b) => a.date.localeCompare(b.date));

  let nid = 1;
  for (const row of filtered) {
    row.id = nid++;
  }

  return { ok: true, payments: filtered };
}

type LoanPaymentPaidRow = Pick<LoanPaymentDb, "amount" | "paidOn">;

export function computeLoanPaidTotal(payments: LoanPaymentPaidRow[]): number {
  return payments.reduce((sum, p) => {
    if (!p.paidOn) return sum;
    const amt = parseAmount(p.amount);
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);
}

export function computeLoanProgressPct(
  totalRepay: number,
  payments: LoanPaymentPaidRow[],
): number | null {
  const total = parseAmount(totalRepay);
  if (!Number.isFinite(total) || total <= 0) return null;
  const paid = computeLoanPaidTotal(payments);
  const pct = Math.round((paid / total) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function findFirstUnpaidLoanPayment<T extends { date: string; paidOn: string | null }>(
  payments: T[],
): T | null {
  const sorted = [...payments].sort((a, b) => a.date.localeCompare(b.date));
  for (const p of sorted) {
    if (!p.paidOn && p.date) return p;
  }
  return null;
}

export function isPrivateLoanFullyPaid(
  payments: LoanPaymentClient[],
  totalRepay?: number,
): boolean {
  if (totalRepay != null && Number.isFinite(totalRepay) && totalRepay > 0) {
    return computeLoanPaidTotal(payments) >= totalRepay - 0.01;
  }
  if (!payments.length) return false;
  return payments.every((p) => !!p.paidOn);
}

export function isPrivateLoanDueActive(
  isPrivateLoan: boolean,
  payments: LoanPaymentClient[],
  totalRepay?: number,
): boolean {
  if (!isPrivateLoan) return true;
  if (isPrivateLoanFullyPaid(payments, totalRepay)) return false;
  return true;
}

export function findNextUnpaidLoanPaymentDate(
  payments: LoanPaymentClient[],
): string | null {
  const next = findFirstUnpaidLoanPayment(payments);
  return next?.date ?? null;
}

/** Sinhronizē `next_payment_date`, `amount`, `period` no maksājumu grafika. */
export function syncPrivateLoanDerivedFields(row: Record<string, unknown>): void {
  const payments = coerceLoanPaymentsFromDb(row.loan_payments);
  const next = findFirstUnpaidLoanPayment(payments);
  if (next) {
    row.next_payment_date = next.date;
    row.amount = next.amount;
  } else if (payments.length > 0) {
    const last = [...payments].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!;
    row.next_payment_date = last.date;
    row.amount = last.amount;
  }
  row.period = "once";
}

function addMonthsToIso(iso: string, months: number): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  d.setMonth(d.getMonth() + months);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${m < 10 ? "0" : ""}${m}-${day < 10 ? "0" : ""}${day}`;
}

/** Ja vēl nav atmaksāts pilnībā un nav neapmaksātu rindu, pievieno nākamo plānoto maksājumu. */
export function appendNextLoanPaymentIfOwing(
  payments: LoanPaymentDb[],
  totalRepay: number,
  referenceDueIso: string,
  referenceAmount: number,
): LoanPaymentDb[] {
  const total = parseAmount(totalRepay);
  if (!Number.isFinite(total) || total <= 0) return payments;
  if (computeLoanPaidTotal(payments) >= total - 0.01) return payments;
  if (findFirstUnpaidLoanPayment(payments)) return payments;

  const due = normalizeIsoDate(referenceDueIso);
  const remaining = Math.round((total - computeLoanPaidTotal(payments)) * 100) / 100;
  if (remaining <= 0.009) return payments;

  const refAmt = parseAmount(referenceAmount);
  const amt =
    Number.isFinite(refAmt) && refAmt > 0
      ? Math.min(Math.round(refAmt * 100) / 100, remaining)
      : remaining;

  const nextDate = due ? addMonthsToIso(due, 1) : "";
  if (!nextDate) return payments;

  const nextId =
    payments.reduce((max, p) => (p.id > max ? p.id : max), 0) + 1;

  return [
    ...payments,
    { id: nextId, date: nextDate, amount: amt, paidOn: null },
  ];
}

export function markPrivateLoanPaymentPaid(
  payments: LoanPaymentDb[],
  dueIso: string,
  paidOnIso: string,
  paidAmount?: number | null,
): { ok: false; message: string } | { ok: true; payments: LoanPaymentDb[] } {
  const due = normalizeIsoDate(dueIso);
  const paidOn = normalizeIsoDate(paidOnIso);
  if (!due || !paidOn) {
    return { ok: false, message: "paidOn must be YYYY-MM-DD" };
  }

  const actualAmount = parseAmount(paidAmount);

  let matched = false;
  const updated = payments.map((p) => {
    if (p.date === due && !p.paidOn) {
      matched = true;
      const amount =
        Number.isFinite(actualAmount) && actualAmount > 0 ? actualAmount : p.amount;
      return { ...p, paidOn, amount };
    }
    return p;
  });

  if (!matched) {
    return { ok: false, message: "No unpaid loan payment matches the due date" };
  }

  return { ok: true, payments: updated };
}

export function loanPaymentsSum(payments: LoanPaymentDb[]): number {
  return payments.reduce((sum, p) => sum + (parseAmount(p.amount) || 0), 0);
}

/** Atjaunina neapmaksātās rindas summu grafikā (pirms „samaksāts”). */
export function syncPrivateLoanPaymentAmountForDue(
  payments: LoanPaymentDb[],
  dueIso: string,
  amount: number,
): LoanPaymentDb[] {
  const due = normalizeIsoDate(dueIso);
  const amt = parseAmount(amount);
  if (!due || !Number.isFinite(amt) || amt < 0) return payments;
  return payments.map((p) => {
    if (p.date === due && !p.paidOn) {
      return { ...p, amount: amt };
    }
    return p;
  });
}

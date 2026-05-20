import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionPaymentRow = {
  id: string;
  user_id: string;
  subscription_id: string;
  paid_on: string;
  amount_paid: number | string;
  amount_scheduled: number | string;
  period: string;
  next_payment_date_after: string | null;
  note: string | null;
  created_at: string;
};

type DeviceJson = {
  amount?: number | string;
  termEnd?: string;
  term_end?: string;
};

function parseAmount(raw: unknown): number {
  const n =
    typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function normalizeIsoDate(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function isTermEndedOnRef(termEndRaw: unknown, refIso: string): boolean {
  const termEnd = normalizeIsoDate(termEndRaw);
  if (!termEnd) return false;
  return termEnd < refIso;
}

function sumDeviceAmountsForPaidOn(
  devices: unknown,
  paidOnIso: string,
): number {
  if (!Array.isArray(devices)) return 0;
  return (devices as DeviceJson[]).reduce((sum, d) => {
    if (!d || typeof d !== "object") return sum;
    const termEnd = d.termEnd ?? d.term_end;
    if (isTermEndedOnRef(termEnd, paidOnIso)) return sum;
    return sum + parseAmount(d.amount);
  }, 0);
}

/** Plānotā un faktiskā summa termiņā (abonements + aktīvas papildu rindas). */
export function computeScheduledPaymentAmount(
  subscription: {
    amount: unknown;
    devices?: unknown;
  },
  paidOnIso: string,
): number {
  const base = parseAmount(subscription.amount);
  return base + sumDeviceAmountsForPaidOn(subscription.devices, paidOnIso);
}

export function parseAmountPaidOverride(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = parseAmount(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

export type RecordSubscriptionPaymentInput = {
  userId: string;
  subscriptionId: string;
  paidOn: string;
  amountPaid: number;
  amountScheduled: number;
  period: string;
  nextPaymentDateAfter: string | null;
  note?: string | null;
};

export async function insertSubscriptionPayment(
  supabase: SupabaseClient,
  input: RecordSubscriptionPaymentInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.from("subscription_payments").insert({
    user_id: input.userId,
    subscription_id: input.subscriptionId,
    paid_on: input.paidOn,
    amount_paid: input.amountPaid,
    amount_scheduled: input.amountScheduled,
    period: input.period,
    next_payment_date_after: input.nextPaymentDateAfter,
    note: input.note ?? null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

/** Kalendāram: { "YYYY-MM-DD": skaits } pēc paid_on. */
export async function fetchPaidCalendarDayCounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("subscription_payments")
    .select("paid_on")
    .eq("user_id", userId);

  if (error || !data) {
    return {};
  }

  const out: Record<string, number> = {};
  for (const row of data as { paid_on: string }[]) {
    const iso = normalizeIsoDate(row.paid_on);
    if (!iso) continue;
    out[iso] = (out[iso] ?? 0) + 1;
  }
  return out;
}

export function isMarkPaidPatchBody(body: Record<string, unknown>): boolean {
  return body.markPaid === true || body.markPaid === "true";
}

export function parsePaidOnFromPatch(
  body: Record<string, unknown>,
  fallbackDueDate: string,
): string | null {
  if (body.paidOn !== undefined) {
    const fromBody = normalizeIsoDate(body.paidOn);
    if (!fromBody) return null;
    return fromBody;
  }
  return normalizeIsoDate(fallbackDueDate);
}

/** Servera/klients kopīga loģika: vai abonements rāda maksājumu (kā `dash-alerts.js`). */

export function normalizeSubscriptionDateIso(dateStr: unknown): string {
  if (dateStr == null || dateStr === "") return "";
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeRefDate(refDate?: Date): Date {
  const ref = refDate ? new Date(refDate) : new Date();
  if (Number.isNaN(ref.getTime())) return new Date();
  ref.setHours(0, 0, 0, 0);
  return ref;
}

function isTermEndedForRef(termEndStr: string, refDate: Date): boolean {
  const termEnd = normalizeSubscriptionDateIso(termEndStr);
  if (!termEnd) return false;
  const te = new Date(`${termEnd}T00:00:00`);
  te.setHours(0, 0, 0, 0);
  return refDate.getTime() > te.getTime();
}

function isDueDateWithinTerm(dueIso: string, termEndStr: string): boolean {
  const due = normalizeSubscriptionDateIso(dueIso);
  const termEnd = normalizeSubscriptionDateIso(termEndStr);
  if (!termEnd) return true;
  if (!due) return false;
  return due <= termEnd;
}

export function isSubscriptionDueActive(
  nextPaymentDate: string,
  termEnd: string,
  refDate?: Date,
): boolean {
  const ref = normalizeRefDate(refDate);
  if (isTermEndedForRef(termEnd, ref)) return false;
  return isDueDateWithinTerm(nextPaymentDate, termEnd);
}

export function todayIsoLocal(refDate?: Date): string {
  const ref = normalizeRefDate(refDate);
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, "0");
  const d = String(ref.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIsoInTimezone(timezone: string, refDate = new Date()): string {
  try {
    return refDate.toLocaleDateString("en-CA", { timeZone: timezone });
  } catch {
    return todayIsoLocal(refDate);
  }
}

export function overdueDays(dueIso: string, todayIso: string): number {
  const due = normalizeSubscriptionDateIso(dueIso);
  if (!due || !todayIso) return 0;
  const dueMs = new Date(`${due}T00:00:00`).getTime();
  const todayMs = new Date(`${todayIso}T00:00:00`).getTime();
  return Math.max(0, Math.round((todayMs - dueMs) / 86400000));
}

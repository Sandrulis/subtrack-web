import type {
  SubscriptionClient,
  SubscriptionDeviceClient,
  SubscriptionRow,
} from "./subscription-client";
import { LEGACY_SUBSCRIPTION_CATEGORY_KEYS } from "./subscription-categories-server";
import {
  coerceLoanPaymentsFromDb,
  isPrivateLoanCategoryKey,
  normalizeLoanPaymentsForDb,
  PRIVATE_LOAN_CATEGORY_KEY,
  subscriptionIsPrivateLoan,
  syncPrivateLoanDerivedFields,
  syncPrivateLoanPaymentAmountForDue,
  type LoanPaymentDb,
} from "./private-loan";

function coerceDevicesFromDb(raw: unknown): SubscriptionDeviceClient[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      return {
        id: index + 1,
        name: "",
        note: "",
        amount: 0,
        termStart: "",
        termEnd: "",
      };
    }
    const o = item as Record<string, unknown>;
    const idRaw = o.id;
    const id =
      typeof idRaw === "number" && !Number.isNaN(idRaw)
        ? idRaw
        : typeof idRaw === "string" && /^\d+$/.test(idRaw)
          ? parseInt(idRaw, 10)
          : index + 1;
    const termStart = String(o.termStart ?? o.term_start ?? "").trim();
    const termEnd = String(o.termEnd ?? o.term_end ?? "").trim();
    const amountNum = parseFloat(String(o.amount ?? 0));
    return {
      id,
      name: String(o.name ?? ""),
      note: String(o.note ?? ""),
      amount: Number.isFinite(amountNum) ? amountNum : 0,
      termStart,
      termEnd,
    };
  });
}

function parseOptionalAmount(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = parseFloat(String(raw).trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function mapSubscriptionRowToClient(row: SubscriptionRow): SubscriptionClient {
  const amt =
    typeof row.amount === "number"
      ? row.amount
      : parseFloat(String(row.amount));
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    amount: Number.isFinite(amt) ? amt : 0,
    dynamicAmount: row.is_dynamic_amount === true,
    dynamicCarryPrevious: row.is_dynamic_carry_previous === true,
    dueAmountOverride: (() => {
      if (row.due_amount_override == null || row.due_amount_override === "") {
        return null;
      }
      const n = parseFloat(String(row.due_amount_override));
      return Number.isFinite(n) ? n : null;
    })(),
    dueAmountOverrideFor: row.due_amount_override_for ?? "",
    period: row.period,
    date: row.next_payment_date,
    icon: row.icon,
    color: row.color,
    note: row.note ?? "",
    termStart: row.term_start ?? "",
    termEnd: row.term_end ?? "",
    devices: coerceDevicesFromDb(row.devices),
    isPrivateLoan: subscriptionIsPrivateLoan(row),
    loanPrincipal: (() => {
      if (row.loan_principal == null || row.loan_principal === "") return 0;
      const n = parseFloat(String(row.loan_principal));
      return Number.isFinite(n) ? n : 0;
    })(),
    loanTotalRepay: (() => {
      if (row.loan_total_repay == null || row.loan_total_repay === "") return 0;
      const n = parseFloat(String(row.loan_total_repay));
      return Number.isFinite(n) ? n : 0;
    })(),
    loanPayments: coerceLoanPaymentsFromDb(row.loan_payments),
  };
}

const LEGACY_ALLOWED_CATEGORY = new Set<string>(LEGACY_SUBSCRIPTION_CATEGORY_KEYS);

function resolveAllowedCategories(
  allowedCategories?: Set<string> | null,
): Set<string> {
  if (allowedCategories && allowedCategories.size > 0) {
    return allowedCategories;
  }
  return LEGACY_ALLOWED_CATEGORY;
}

function isAllowedCategory(key: string, allowed: Set<string>): boolean {
  return allowed.has(key);
}

const ALLOWED_PERIOD = new Set(["monthly", "yearly", "weekly", "once"]);

export type SubscriptionPayloadInput = {
  name?: unknown;
  category?: unknown;
  amount?: unknown;
  period?: unknown;
  date?: unknown;
  icon?: unknown;
  color?: unknown;
  note?: unknown;
  termStart?: unknown;
  termEnd?: unknown;
  devices?: unknown;
  dynamicAmount?: unknown;
  dynamicCarryPrevious?: unknown;
  dueAmountOverride?: unknown;
  dueDate?: unknown;
  isPrivateLoan?: unknown;
  loanPrincipal?: unknown;
  loanTotalRepay?: unknown;
  loanPayments?: unknown;
};

type SubscriptionDeviceDbRow = {
  id: number;
  name: string;
  note: string;
  amount: number;
  termStart: string;
  termEnd: string;
};

function devicesForDb(raw: unknown): SubscriptionDeviceDbRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      return {
        id: index + 1,
        name: "",
        note: "",
        amount: 0,
        termStart: "",
        termEnd: "",
      };
    }
    const o = item as Record<string, unknown>;
    const idRaw = o.id;
    const id =
      typeof idRaw === "number" && !Number.isNaN(idRaw)
        ? idRaw
        : typeof idRaw === "string" && /^\d+$/.test(idRaw)
          ? parseInt(idRaw, 10)
          : index + 1;
    const ts = String(o.termStart ?? o.term_start ?? "").trim();
    const te = String(o.termEnd ?? o.term_end ?? "").trim();
    const amountNum = parseFloat(String(o.amount ?? 0));
    return {
      id,
      name: String(o.name ?? ""),
      note: String(o.note ?? ""),
      amount: Number.isFinite(amountNum) ? amountNum : 0,
      termStart: ts,
      termEnd: te,
    };
  });
}

function deviceRowHasContent(d: SubscriptionDeviceDbRow): boolean {
  const name = d.name.trim();
  const note = d.note.trim();
  const amountSig = Number.isFinite(d.amount) && d.amount !== 0;
  return !!(note || d.termStart || d.termEnd || amountSig || name);
}

function isPrivateLoanFlag(raw: unknown): boolean {
  return raw === true || raw === "true";
}

function parsePrivateLoanBlock(
  body: SubscriptionPayloadInput,
  opts: { requireSchedule: boolean; category: string },
):
  | { ok: false; message: string }
  | {
      ok: true;
      isPrivateLoan: boolean;
      loanPrincipal: number | null;
      loanTotalRepay: number | null;
      loanPayments: LoanPaymentDb[];
    } {
  const isPrivateLoan =
    isPrivateLoanFlag(body.isPrivateLoan) ||
    isPrivateLoanCategoryKey(opts.category);
  if (!isPrivateLoan) {
    return {
      ok: true,
      isPrivateLoan: false,
      loanPrincipal: null,
      loanTotalRepay: null,
      loanPayments: [],
    };
  }

  const loanPrincipal = parseOptionalAmount(body.loanPrincipal);
  if (loanPrincipal === null) {
    return { ok: false, message: "loanPrincipal must be zero or a positive number" };
  }

  const loanTotalRepay = parseOptionalAmount(body.loanTotalRepay);
  if (loanTotalRepay === null || loanTotalRepay <= 0) {
    return { ok: false, message: "loanTotalRepay must be a positive number" };
  }

  const scheduleRes = normalizeLoanPaymentsForDb(body.loanPayments);
  if (!scheduleRes.ok) {
    return scheduleRes;
  }

  if (opts.requireSchedule && scheduleRes.payments.length === 0) {
    return { ok: false, message: "Private loan requires at least one payment" };
  }

  return {
    ok: true,
    isPrivateLoan: true,
    loanPrincipal,
    loanTotalRepay,
    loanPayments: scheduleRes.payments,
  };
}

function applyPrivateLoanFieldsToRow(
  row: Record<string, unknown>,
  loan: Extract<ReturnType<typeof parsePrivateLoanBlock>, { ok: true }>,
): void {
  if (!loan.isPrivateLoan) {
    row.is_private_loan = false;
    row.loan_principal = null;
    row.loan_total_repay = null;
    row.loan_payments = [];
    return;
  }

  row.is_private_loan = true;
  row.loan_principal = loan.loanPrincipal;
  row.loan_total_repay = loan.loanTotalRepay;
  row.loan_payments = loan.loanPayments;
  row.category = PRIVATE_LOAN_CATEGORY_KEY;
  row.is_dynamic_amount = true;
  row.is_dynamic_carry_previous = false;
  row.due_amount_override = null;
  row.due_amount_override_for = null;
  row.term_start = null;
  row.term_end = null;
  row.devices = [];
  syncPrivateLoanDerivedFields(row);
}

export function normalizeDevicesForSubscription(
  raw: unknown,
):
  | { ok: false; message: string }
  | { ok: true; devices: SubscriptionDeviceDbRow[] } {
  const mapped = devicesForDb(raw);
  const filtered = mapped.filter(deviceRowHasContent);
  for (const row of filtered) {
    if (!row.name.trim()) {
      return {
        ok: false,
        message:
          "Each add-on line with any details filled in must include a title",
      };
    }
  }
  return { ok: true, devices: filtered };
}

/**
 * Parsē un validē API ķermeni. Atgriež kļūdas ziņu (EN, strukturēta API atbildei) vai DB ierakstu.
 */
export function parseSubscriptionPayload(
  body: SubscriptionPayloadInput | null | undefined,
  opts?: { allowedCategories?: Set<string> },
): { ok: false; message: string } | { ok: true; row: Record<string, unknown> } {
  const allowedCategory = resolveAllowedCategories(opts?.allowedCategories);
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Invalid JSON body" };
  }

  const devicesRes = normalizeDevicesForSubscription(body.devices);
  if (!devicesRes.ok) {
    return devicesRes;
  }
  const devicesNorm = devicesRes.devices;

  const categoryRaw = String(body.category ?? "subscription").trim();
  if (!isAllowedCategory(categoryRaw, allowedCategory)) {
    return { ok: false, message: "Invalid category" };
  }
  const category = categoryRaw;

  const loanRes = parsePrivateLoanBlock(body, {
    requireSchedule: true,
    category,
  });
  if (!loanRes.ok) {
    return loanRes;
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return { ok: false, message: "Name is required" };
  }
  if (!loanRes.isPrivateLoan && devicesNorm.length > 0 && !name) {
    return {
      ok: false,
      message: "Name is required when add-ons are present",
    };
  }

  const amountStr =
    body.amount === undefined || body.amount === null
      ? ""
      : String(body.amount).trim();
  const amountNum = amountStr === "" ? 0 : parseFloat(amountStr);
  if (!Number.isFinite(amountNum) || amountNum < 0) {
    return {
      ok: false,
      message: "Amount must be zero or a positive number",
    };
  }

  const periodRaw = String(body.period ?? "monthly").trim();
  if (!ALLOWED_PERIOD.has(periodRaw)) {
    return { ok: false, message: "Invalid period" };
  }
  let period = periodRaw;

  let date = String(body.date ?? "").trim();
  if (loanRes.isPrivateLoan) {
    period = "once";
    const firstUnpaid = loanRes.loanPayments.find((p) => !p.paidOn);
    const anchor = firstUnpaid ?? loanRes.loanPayments[loanRes.loanPayments.length - 1];
    date = anchor?.date ?? date;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "next_payment_date (date) must be YYYY-MM-DD" };
  }

  const icon =
    body.icon != null && String(body.icon).trim() !== ""
      ? String(body.icon).trim()
      : null;
  const color =
    body.color != null && String(body.color).trim() !== ""
      ? String(body.color).trim()
      : null;

  const note =
    body.note != null && String(body.note).trim() !== ""
      ? String(body.note).trim()
      : null;

  const termStart = loanRes.isPrivateLoan ? "" : String(body.termStart ?? "").trim();
  const termEnd = loanRes.isPrivateLoan ? "" : String(body.termEnd ?? "").trim();
  if (termStart && termEnd) {
    const ts = new Date(`${termStart}T00:00:00`);
    const te = new Date(`${termEnd}T00:00:00`);
    if (Number.isNaN(ts.getTime()) || Number.isNaN(te.getTime()) || te <= ts) {
      return { ok: false, message: "term_end must be after term_start" };
    }
  }

  const dynamicAmount =
    !loanRes.isPrivateLoan &&
    (body.dynamicAmount === true || body.dynamicAmount === "true");
  const dynamicCarryPrevious =
    dynamicAmount &&
    (body.dynamicCarryPrevious === true || body.dynamicCarryPrevious === "true");

  const row: Record<string, unknown> = {
    name,
    category,
    amount: amountNum,
    is_dynamic_amount: dynamicAmount,
    is_dynamic_carry_previous: dynamicCarryPrevious,
    period,
    next_payment_date: date,
    icon,
    color,
    note,
    term_start: termStart || null,
    term_end: termEnd || null,
    devices: loanRes.isPrivateLoan ? [] : devicesNorm,
  };

  applyPrivateLoanFieldsToRow(row, loanRes);
  if (loanRes.isPrivateLoan) {
    syncPrivateLoanDerivedFields(row);
  }

  return { ok: true, row };
}

function clearDueAmountOverrideFields(
  row: Record<string, unknown>,
): void {
  row.due_amount_override = null;
  row.due_amount_override_for = null;
}

export function parseSubscriptionPatch(
  body: SubscriptionPayloadInput | null | undefined,
  existing?: SubscriptionRow | null,
  opts?: { allowedCategories?: Set<string> },
): { ok: false; message: string } | { ok: true; row: Record<string, unknown> } {
  const allowedCategory = resolveAllowedCategories(opts?.allowedCategories);
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Invalid JSON body" };
  }

  const row: Record<string, unknown> = {};

  if (body.name !== undefined) {
    row.name = String(body.name ?? "").trim();
  }

  if (body.category !== undefined) {
    const categoryRaw = String(body.category ?? "").trim();
    if (!isAllowedCategory(categoryRaw, allowedCategory)) {
      return { ok: false, message: "Invalid category" };
    }
    row.category = categoryRaw;
  }

  if (body.amount !== undefined) {
    const amountStr =
      body.amount === null ? "" : String(body.amount).trim();
    const amountNum = amountStr === "" ? 0 : parseFloat(amountStr);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      return {
        ok: false,
        message: "Amount must be zero or a positive number",
      };
    }
    row.amount = amountNum;
  }

  if (body.period !== undefined) {
    const periodRaw = String(body.period ?? "").trim();
    if (!ALLOWED_PERIOD.has(periodRaw)) {
      return { ok: false, message: "Invalid period" };
    }
    row.period = periodRaw;
  }

  if (body.date !== undefined) {
    const date = String(body.date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { ok: false, message: "date must be YYYY-MM-DD" };
    }
    row.next_payment_date = date;
    if (existing) {
      const prevDue = String(existing.next_payment_date ?? "").trim();
      if (date !== prevDue) {
        clearDueAmountOverrideFields(row);
      }
    }
  }

  if (body.icon !== undefined) {
    row.icon =
      body.icon != null && String(body.icon).trim() !== ""
        ? String(body.icon).trim()
        : null;
  }

  if (body.color !== undefined) {
    row.color =
      body.color != null && String(body.color).trim() !== ""
        ? String(body.color).trim()
        : null;
  }

  if (body.note !== undefined) {
    row.note =
      body.note != null && String(body.note).trim() !== ""
        ? String(body.note).trim()
        : null;
  }

  if (body.termStart !== undefined || body.termEnd !== undefined) {
    const tsIn =
      body.termStart !== undefined ? String(body.termStart ?? "").trim() : undefined;
    const teIn =
      body.termEnd !== undefined ? String(body.termEnd ?? "").trim() : undefined;

    const tsEff = tsIn !== undefined ? tsIn : "";
    const teEff = teIn !== undefined ? teIn : "";
    if (tsEff && teEff) {
      const ts = new Date(`${tsEff}T00:00:00`);
      const te = new Date(`${teEff}T00:00:00`);
      if (Number.isNaN(ts.getTime()) || Number.isNaN(te.getTime()) || te <= ts) {
        return { ok: false, message: "term_end must be after term_start" };
      }
    }

    if (tsIn !== undefined) {
      row.term_start = tsIn || null;
    }
    if (teIn !== undefined) {
      row.term_end = teIn || null;
    }
  }

  if (body.devices !== undefined) {
    const dr = normalizeDevicesForSubscription(body.devices);
    if (!dr.ok) {
      return dr;
    }
    row.devices = dr.devices;
  }

  if (body.dynamicAmount !== undefined) {
    const isDynamic =
      body.dynamicAmount === true || body.dynamicAmount === "true";
    row.is_dynamic_amount = isDynamic;
    if (!isDynamic) {
      clearDueAmountOverrideFields(row);
      row.is_dynamic_carry_previous = false;
    }
  }

  if (body.dynamicCarryPrevious !== undefined) {
    const effectiveDynamic =
      row.is_dynamic_amount !== undefined
        ? row.is_dynamic_amount === true
        : existing?.is_dynamic_amount === true;
    row.is_dynamic_carry_previous =
      effectiveDynamic &&
      (body.dynamicCarryPrevious === true || body.dynamicCarryPrevious === "true");
  }

  if (body.dueAmountOverride !== undefined && existing) {
    const allowsPeriodOverride =
      existing.is_dynamic_amount === true ||
      subscriptionIsPrivateLoan(existing);
    if (!allowsPeriodOverride) {
      return {
        ok: false,
        message: "Period amount override only applies to dynamic payments",
      };
    }
    const dueDate = String(
      body.dueDate ?? existing.next_payment_date ?? "",
    ).trim();
    const currentDue = String(existing.next_payment_date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return { ok: false, message: "dueDate must be YYYY-MM-DD" };
    }
    if (dueDate !== currentDue) {
      return {
        ok: false,
        message: "dueDate must match current next payment date",
      };
    }
    if (body.dueAmountOverride === null || body.dueAmountOverride === "") {
      clearDueAmountOverrideFields(row);
    } else {
      const amountStr = String(body.dueAmountOverride).trim();
      const amountNum = amountStr === "" ? 0 : parseFloat(amountStr);
      if (!Number.isFinite(amountNum) || amountNum < 0) {
        return {
          ok: false,
          message: "dueAmountOverride must be zero or a positive number",
        };
      }
      const baseNum = parseFloat(String(existing.amount ?? 0));
      const base = Number.isFinite(baseNum) ? baseNum : 0;
      if (Math.abs(amountNum - base) < 0.0001) {
        clearDueAmountOverrideFields(row);
      } else {
        row.due_amount_override = amountNum;
        row.due_amount_override_for = dueDate;
      }
      if (subscriptionIsPrivateLoan(existing)) {
        row.is_dynamic_amount = true;
        const currentPayments = coerceLoanPaymentsFromDb(
          existing.loan_payments,
        ).map((p) => ({
          id: p.id,
          date: p.date,
          amount: p.amount,
          paidOn: p.paidOn || null,
        }));
        row.loan_payments = syncPrivateLoanPaymentAmountForDue(
          currentPayments,
          dueDate,
          amountNum,
        );
        row.amount = amountNum;
        syncPrivateLoanDerivedFields(row);
      }
    }
  }

  if (Object.keys(row).length === 0) {
    return { ok: false, message: "No fields to update" };
  }

  const mergedCategory = String(
    row.category ?? existing?.category ?? "",
  ).trim();
  const categoryBecamePrivateLoan =
    body.category !== undefined && isPrivateLoanCategoryKey(mergedCategory);
  const categoryLeftPrivateLoan =
    body.category !== undefined &&
    existing &&
    subscriptionIsPrivateLoan(existing) &&
    !isPrivateLoanCategoryKey(mergedCategory);

  const touchesLoan =
    body.isPrivateLoan !== undefined ||
    body.loanPrincipal !== undefined ||
    body.loanTotalRepay !== undefined ||
    body.loanPayments !== undefined ||
    categoryBecamePrivateLoan ||
    categoryLeftPrivateLoan;

  if (touchesLoan) {
    const effectiveIsPrivateLoan =
      categoryLeftPrivateLoan
        ? false
        : body.isPrivateLoan !== undefined
          ? isPrivateLoanFlag(body.isPrivateLoan)
          : categoryBecamePrivateLoan ||
            (existing ? subscriptionIsPrivateLoan(existing) : false);

    if (effectiveIsPrivateLoan) {
      const loanRes = parsePrivateLoanBlock(
        {
          isPrivateLoan: true,
          loanPrincipal:
            body.loanPrincipal !== undefined
              ? body.loanPrincipal
              : existing?.loan_principal,
          loanTotalRepay:
            body.loanTotalRepay !== undefined
              ? body.loanTotalRepay
              : existing?.loan_total_repay,
          loanPayments:
            body.loanPayments !== undefined
              ? body.loanPayments
              : existing?.loan_payments,
        },
        { requireSchedule: true, category: PRIVATE_LOAN_CATEGORY_KEY },
      );
      if (!loanRes.ok) {
        return loanRes;
      }
      applyPrivateLoanFieldsToRow(row, loanRes);
      syncPrivateLoanDerivedFields(row);
    } else {
      applyPrivateLoanFieldsToRow(row, {
        ok: true,
        isPrivateLoan: false,
        loanPrincipal: null,
        loanTotalRepay: null,
        loanPayments: [],
      });
    }
  } else if (existing && subscriptionIsPrivateLoan(existing)) {
    syncPrivateLoanDerivedFields(row);
  }

  return { ok: true, row };
}

import type {
  SubscriptionClient,
  SubscriptionDeviceClient,
  SubscriptionRow,
} from "./subscription-client";

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
  };
}

const ALLOWED_CATEGORY = new Set([
  "subscription",
  "bill",
  "credit",
  "leasing",
  "insurance",
  "other",
]);

const ALLOWED_PERIOD = new Set(["monthly", "yearly", "weekly"]);

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
  dueAmountOverride?: unknown;
  dueDate?: unknown;
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
): { ok: false; message: string } | { ok: true; row: Record<string, unknown> } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Invalid JSON body" };
  }

  const devicesRes = normalizeDevicesForSubscription(body.devices);
  if (!devicesRes.ok) {
    return devicesRes;
  }
  const devicesNorm = devicesRes.devices;

  const name = String(body.name ?? "").trim();
  if (devicesNorm.length > 0 && !name) {
    return {
      ok: false,
      message: "Name is required when add-ons are present",
    };
  }

  const categoryRaw = String(body.category ?? "subscription").trim();
  if (!ALLOWED_CATEGORY.has(categoryRaw)) {
    return { ok: false, message: "Invalid category" };
  }
  const category = categoryRaw;

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
  const period = periodRaw;

  const date = String(body.date ?? "").trim();
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

  const termStart = String(body.termStart ?? "").trim();
  const termEnd = String(body.termEnd ?? "").trim();
  if (termStart && termEnd) {
    const ts = new Date(`${termStart}T00:00:00`);
    const te = new Date(`${termEnd}T00:00:00`);
    if (Number.isNaN(ts.getTime()) || Number.isNaN(te.getTime()) || te <= ts) {
      return { ok: false, message: "term_end must be after term_start" };
    }
  }

  const dynamicAmount = body.dynamicAmount === true || body.dynamicAmount === "true";

  const row: Record<string, unknown> = {
    name,
    category,
    amount: amountNum,
    is_dynamic_amount: dynamicAmount,
    period,
    next_payment_date: date,
    icon,
    color,
    note,
    term_start: termStart || null,
    term_end: termEnd || null,
    devices: devicesNorm,
  };

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
): { ok: false; message: string } | { ok: true; row: Record<string, unknown> } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Invalid JSON body" };
  }

  const row: Record<string, unknown> = {};

  if (body.name !== undefined) {
    row.name = String(body.name ?? "").trim();
  }

  if (body.category !== undefined) {
    const categoryRaw = String(body.category ?? "").trim();
    if (!ALLOWED_CATEGORY.has(categoryRaw)) {
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
    }
  }

  if (body.dueAmountOverride !== undefined && existing) {
    if (existing.is_dynamic_amount !== true) {
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
    }
  }

  if (Object.keys(row).length === 0) {
    return { ok: false, message: "No fields to update" };
  }

  return { ok: true, row };
}

import {
  isValidPaidPlanAnnualPrice,
  parsePaidPlanPriceField,
} from "@/lib/paid-plan-annual";

export { PAID_PLAN_PRICE_MIN, PAID_PLAN_PRICE_MAX } from "@/lib/paid-plan-annual";

export type PaidPlanLifetimeConfig = {
  enabled: boolean;
  priceEur: number | null;
  endsAt: string | null;
  purchaseLimit: number | null;
  purchaseCount: number;
};

export type PaidPlanLifetimePublic = PaidPlanLifetimeConfig & {
  /** Derīgs lifetime piedāvājums publiskai rādīšanai (nav beidzies laiks / limits). */
  active: boolean;
  /** Atlikušais laiks ms; `null`, ja nav laika limita vai jau beidzies. */
  remainingMs: number | null;
  /** Atlikušie pirkumi; `null`, ja nav iegādes limita. */
  purchasesRemaining: number | null;
};

function parsePositiveIntField(raw: unknown): number | null {
  const n =
    typeof raw === "number"
      ? Math.trunc(raw)
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : NaN;
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

function parseNonNegativeIntField(raw: unknown): number {
  const n =
    typeof raw === "number"
      ? Math.trunc(raw)
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : NaN;
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function parseEndsAtField(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

export function normalizePaidPlanLifetimeRow(data: unknown): PaidPlanLifetimeConfig {
  if (!data || typeof data !== "object") {
    return {
      enabled: false,
      priceEur: null,
      endsAt: null,
      purchaseLimit: null,
      purchaseCount: 0,
    };
  }
  const r = data as Record<string, unknown>;
  const paidPlanOn =
    r.paid_plan_enabled === true ||
    r.paid_plan_enabled === "true" ||
    r.paid_plan_enabled === 1 ||
    r.paid_plan_enabled === "1";
  const lifetimeOn =
    r.paid_plan_lifetime_enabled === true ||
    r.paid_plan_lifetime_enabled === "true" ||
    r.paid_plan_lifetime_enabled === 1 ||
    r.paid_plan_lifetime_enabled === "1";
  const enabled = paidPlanOn && lifetimeOn;
  const priceEur = parsePaidPlanPriceField(r.paid_plan_lifetime_price_eur);
  return {
    enabled,
    priceEur,
    endsAt: parseEndsAtField(r.paid_plan_lifetime_ends_at),
    purchaseLimit: parsePositiveIntField(r.paid_plan_lifetime_purchase_limit),
    purchaseCount: parseNonNegativeIntField(r.paid_plan_lifetime_purchase_count),
  };
}

/** Admin formai – lifetime slēdzis neatkarīgi no maksas plāna slēgja. */
export function normalizePaidPlanLifetimeAdminRow(data: unknown): PaidPlanLifetimeConfig {
  if (!data || typeof data !== "object") {
    return {
      enabled: false,
      priceEur: null,
      endsAt: null,
      purchaseLimit: null,
      purchaseCount: 0,
    };
  }
  const r = data as Record<string, unknown>;
  const enabled =
    r.paid_plan_lifetime_enabled === true ||
    r.paid_plan_lifetime_enabled === "true" ||
    r.paid_plan_lifetime_enabled === 1 ||
    r.paid_plan_lifetime_enabled === "1";
  const priceEur = parsePaidPlanPriceField(r.paid_plan_lifetime_price_eur);
  return {
    enabled,
    priceEur,
    endsAt: parseEndsAtField(r.paid_plan_lifetime_ends_at),
    purchaseLimit: parsePositiveIntField(r.paid_plan_lifetime_purchase_limit),
    purchaseCount: parseNonNegativeIntField(r.paid_plan_lifetime_purchase_count),
  };
}

export function isValidPaidPlanLifetimePrice(
  priceEur: number | null | undefined,
): priceEur is number {
  return isValidPaidPlanAnnualPrice(priceEur);
}

/** Vai lifetime piedāvājums vēl aktīvs (laiks un/vai pirkumu limits nav sasniegts). */
export function resolvePaidPlanLifetimePublic(
  config: PaidPlanLifetimeConfig,
  nowMs: number = Date.now(),
): PaidPlanLifetimePublic {
  const base: PaidPlanLifetimePublic = {
    ...config,
    active: false,
    remainingMs: null,
    purchasesRemaining: null,
  };

  if (!config.enabled || !isValidPaidPlanLifetimePrice(config.priceEur)) {
    return base;
  }

  if (config.endsAt != null) {
    const endsMs = Date.parse(config.endsAt);
    if (Number.isFinite(endsMs)) {
      const remainingMs = endsMs - nowMs;
      if (remainingMs <= 0) {
        return base;
      }
      base.remainingMs = remainingMs;
    }
  }

  if (config.purchaseLimit != null) {
    const remaining = config.purchaseLimit - config.purchaseCount;
    if (remaining <= 0) {
      return { ...base, remainingMs: null, purchasesRemaining: null };
    }
    base.purchasesRemaining = remaining;
  }

  base.active = true;
  return base;
}

export function paidPlanShowsLifetime(lifetime: PaidPlanLifetimePublic): boolean {
  return lifetime.active;
}

/** `datetime-local` vērtība no ISO (admin formai). */
export function formatLifetimeEndsAtForDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseLifetimeEndsAtFromForm(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

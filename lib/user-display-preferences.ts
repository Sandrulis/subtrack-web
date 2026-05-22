/**
 * Lietotāja attēlošanas preferences (`public.users.display_preferences`).
 * Atbilst FS prototipa laukiem settings formā.
 */

import { isValidPreferredLanguageCode } from "@/lib/html-lang";

export const DISPLAY_PREFS_STORAGE_KEY = "subtrack_fs_user_prefs";

export type DisplayPreferences = {
  /** `public.languages.code` - saskarnes valoda (kopā ar `<html lang>` un sīkdatni `subtrack_ui_locale`). */
  interface_language_code: string;
  currency: "EUR" | "USD" | "GBP" | "SEK" | "PLN" | "CHF";
  date_order: "dmy" | "ymd" | "mdy";
  date_sep: "." | "-" | "/";
  time_format: "24" | "12";
  time_sep: ":" | ".";
  timezone: string;
  week_start: "monday" | "sunday";
};

export const DISPLAY_PREFERENCES_DEFAULTS: DisplayPreferences = {
  interface_language_code: "lv",
  currency: "EUR",
  date_order: "dmy",
  date_sep: ".",
  time_format: "24",
  time_sep: ":",
  timezone: "Europe/Riga",
  week_start: "monday",
};

const ALLOWED_CURRENCY = new Set<DisplayPreferences["currency"]>([
  "EUR",
  "USD",
  "GBP",
  "SEK",
  "PLN",
  "CHF",
]);

const ALLOWED_DATE_ORDER = new Set<DisplayPreferences["date_order"]>([
  "dmy",
  "ymd",
  "mdy",
]);

const ALLOWED_DATE_SEP = new Set<DisplayPreferences["date_sep"]>([".", "-", "/"]);

const ALLOWED_TIME_FORMAT = new Set<DisplayPreferences["time_format"]>([
  "24",
  "12",
]);

const ALLOWED_TIME_SEP = new Set<DisplayPreferences["time_sep"]>([":", "."]);

const ALLOWED_WEEK = new Set<DisplayPreferences["week_start"]>([
  "monday",
  "sunday",
]);

/** Ieteicamās laika zonas (saskaņā ar settings formu). */
const ALLOWED_TIMEZONES = new Set<string>([
  "Europe/Riga",
  "Europe/Tallinn",
  "Europe/Vilnius",
  "Europe/Helsinki",
  "Europe/Warsaw",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/London",
  "UTC",
  "America/New_York",
]);

function pickTimezone(v: unknown): DisplayPreferences["timezone"] | undefined {
  if (typeof v !== "string" || !v.trim()) return undefined;
  const t = v.trim();
  return ALLOWED_TIMEZONES.has(t) ? t : undefined;
}

/** Izvelk un validē pazīstamos laukus no JSON / localStorage. */
export function sanitizeDisplayPreferencesPartial(
  raw: unknown,
): Partial<DisplayPreferences> {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const out: Partial<DisplayPreferences> = {};

  if (typeof o.interface_language_code === "string") {
    const trimmed = o.interface_language_code.trim().toLowerCase();
    if (isValidPreferredLanguageCode(trimmed)) {
      out.interface_language_code = trimmed;
    }
  }
  if (typeof o.currency === "string" && ALLOWED_CURRENCY.has(o.currency as DisplayPreferences["currency"])) {
    out.currency = o.currency as DisplayPreferences["currency"];
  }
  if (typeof o.date_order === "string" && ALLOWED_DATE_ORDER.has(o.date_order as DisplayPreferences["date_order"])) {
    out.date_order = o.date_order as DisplayPreferences["date_order"];
  }
  if (typeof o.date_sep === "string" && ALLOWED_DATE_SEP.has(o.date_sep as DisplayPreferences["date_sep"])) {
    out.date_sep = o.date_sep as DisplayPreferences["date_sep"];
  }
  if (
    typeof o.time_format === "string" &&
    ALLOWED_TIME_FORMAT.has(o.time_format as DisplayPreferences["time_format"])
  ) {
    out.time_format = o.time_format as DisplayPreferences["time_format"];
  }
  if (typeof o.time_sep === "string" && ALLOWED_TIME_SEP.has(o.time_sep as DisplayPreferences["time_sep"])) {
    out.time_sep = o.time_sep as DisplayPreferences["time_sep"];
  }
  const tz = pickTimezone(o.timezone);
  if (tz) out.timezone = tz;
  if (
    typeof o.week_start === "string" &&
    ALLOWED_WEEK.has(o.week_start as DisplayPreferences["week_start"])
  ) {
    out.week_start = o.week_start as DisplayPreferences["week_start"];
  }

  return out;
}

/** Pilns objekts: `base` noklusējumi + derīgās partial vērtības. */
export function mergeDisplayPreferences(
  partial: Partial<DisplayPreferences> | null | undefined,
  base: DisplayPreferences = DISPLAY_PREFERENCES_DEFAULTS,
): DisplayPreferences {
  return {
    ...base,
    ...sanitizeDisplayPreferencesPartial(partial ?? {}),
  };
}

/**
 * Kombinē: noklusējumi <- DB partial <- localStorage partial (atklātie LS lauki uzvar).
 * Ja DB satur vismaz vienu derīgu lauku, tas dod pamatu; tad LS pārklāj tikai savus laukus
 * (piemēram `interface_language_code` uzreiz pēc izvēles pirms Supabase saglabāšanas).
 */
export function mergeDisplayPreferencesFromSources(
  localRaw: unknown,
  dbRaw: unknown,
  base: DisplayPreferences = DISPLAY_PREFERENCES_DEFAULTS,
  options?: { prioritizeDbInterfaceLanguage?: boolean },
): DisplayPreferences {
  const fromLocal = sanitizeDisplayPreferencesPartial(localRaw);
  const fromDb = sanitizeDisplayPreferencesPartial(dbRaw);
  const dbHasAny = Object.keys(fromDb).length > 0;
  if (dbHasAny) {
    const merged = mergeDisplayPreferences(
      {
        ...fromDb,
        ...fromLocal,
      },
      base,
    );
    if (options?.prioritizeDbInterfaceLanguage && fromDb.interface_language_code) {
      merged.interface_language_code = fromDb.interface_language_code;
    }
    return merged;
  }
  return mergeDisplayPreferences(fromLocal, base);
}

export function readDisplayPreferencesFromLocalStorage(): Partial<DisplayPreferences> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(DISPLAY_PREFS_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeDisplayPreferencesPartial(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function writeDisplayPreferencesToLocalStorage(prefs: DisplayPreferences): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(DISPLAY_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatPreviewTimeTwelveHour(
  intlLocale: string,
  timeSep: DisplayPreferences["time_sep"],
): string {
  const d = new Date(Date.UTC(2026, 4, 16, 14, 30));
  const formatted = new Intl.DateTimeFormat(intlLocale, {
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
    timeZone: "UTC",
  }).format(d);
  return timeSep === ":" ? formatted : formatted.replace(/:/g, timeSep);
}

function formatPreviewWeekdayName(
  weekStart: DisplayPreferences["week_start"],
  intlLocale: string,
): string {
  const utcMidnight =
    weekStart === "sunday"
      ? new Date(Date.UTC(2026, 4, 17))
      : new Date(Date.UTC(2026, 4, 18));
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(utcMidnight);
}

export type DisplayPreferencesPreviewLabels = {
  week: string;
  currency: string;
  ui: string;
};

/** Kalendāra datums pēc lietotāja `date_order` / `date_sep` un laika zonas. */
export function formatDateForDisplayPreferences(
  date: Date,
  prefs: DisplayPreferences,
  intlLocale: string,
): string {
  const parts = new Intl.DateTimeFormat(intlLocale, {
    timeZone: prefs.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  const sep = prefs.date_sep;
  if (prefs.date_order === "ymd") return `${y}${sep}${m}${sep}${d}`;
  if (prefs.date_order === "mdy") return `${m}${sep}${d}${sep}${y}`;
  return `${d}${sep}${m}${sep}${y}`;
}

/** Piemēra teksts: fiksēts datums; laiks / 12h / nedēļas diena pēc `intlLocale`; etiķetes no tulkošanām. */
export function formatDisplayPreferencesPreview(
  prefs: DisplayPreferences,
  intlLocale: string,
  labels: DisplayPreferencesPreviewLabels,
): string {
  const y = 2026;
  const mo = 5;
  const d = 16;
  const h = 14;
  const mi = 30;
  const sep = prefs.date_sep;
  const dStr = pad2(d);
  const mStr = pad2(mo);
  const yStr = String(y);
  let datePart = "";
  if (prefs.date_order === "ymd") {
    datePart = `${yStr}${sep}${mStr}${sep}${dStr}`;
  } else if (prefs.date_order === "mdy") {
    datePart = `${mStr}${sep}${dStr}${sep}${yStr}`;
  } else {
    datePart = `${dStr}${sep}${mStr}${sep}${yStr}`;
  }

  const timePart =
    prefs.time_format === "24"
      ? `${pad2(h)}${prefs.time_sep}${pad2(mi)}`
      : formatPreviewTimeTwelveHour(intlLocale, prefs.time_sep);

  const curSymbols: Record<DisplayPreferences["currency"], string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    SEK: "kr",
    PLN: "zł",
    CHF: "Fr",
  };
  const cs = curSymbols[prefs.currency] ?? prefs.currency;

  const weekLabel = formatPreviewWeekdayName(prefs.week_start, intlLocale);
  const dot = "\u00b7";
  return `${datePart} ${dot} ${timePart} ${dot} ${prefs.timezone.replace(/\//g, " / ")} ${dot} ${labels.week}: ${weekLabel} ${dot} ${labels.currency}: ${cs} ${dot} ${labels.ui}: ${prefs.interface_language_code}`;
}

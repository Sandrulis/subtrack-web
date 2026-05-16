/**
 * Lietotāja attēlošanas preferences (`public.users.display_preferences`).
 * Atbilst FS prototipa laukiem settings formā.
 */

export const DISPLAY_PREFS_STORAGE_KEY = "subtrack_fs_user_prefs";

export type DisplayPreferences = {
  currency: "EUR" | "USD" | "GBP" | "SEK" | "PLN" | "CHF";
  date_order: "dmy" | "ymd" | "mdy";
  date_sep: "." | "-" | "/";
  time_format: "24" | "12";
  time_sep: ":" | ".";
  timezone: string;
  week_start: "monday" | "sunday";
};

export const DISPLAY_PREFERENCES_DEFAULTS: DisplayPreferences = {
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

/** Pilns objekts: noklusējumi + derīgās partial vērtības. */
export function mergeDisplayPreferences(
  partial: Partial<DisplayPreferences> | null | undefined,
): DisplayPreferences {
  return {
    ...DISPLAY_PREFERENCES_DEFAULTS,
    ...sanitizeDisplayPreferencesPartial(partial ?? {}),
  };
}

/**
 * Kombinē: noklusējumi <- localStorage <- db.
 * DB slānis uzvar, ja tas satur vismaz vienu derīgu lauku.
 */
export function mergeDisplayPreferencesFromSources(
  localRaw: unknown,
  dbRaw: unknown,
): DisplayPreferences {
  const fromLocal = sanitizeDisplayPreferencesPartial(localRaw);
  const fromDb = sanitizeDisplayPreferencesPartial(dbRaw);
  const dbHasAny = Object.keys(fromDb).length > 0;
  if (dbHasAny) {
    return mergeDisplayPreferences({
      ...mergeDisplayPreferences(fromLocal),
      ...fromDb,
    });
  }
  return mergeDisplayPreferences(fromLocal);
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

/** Piemēra teksts iestatījumu formai (fiksēts datums kā FS prototipā). */
export function formatDisplayPreferencesPreview(prefs: DisplayPreferences): string {
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

  const tSep = prefs.time_sep;
  let timePart = "";
  if (prefs.time_format === "12") {
    timePart = `2${tSep}30 pēcpusdiena`;
  } else {
    timePart = `${pad2(h)}${tSep}${pad2(mi)}`;
  }

  const curSymbols: Record<DisplayPreferences["currency"], string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    SEK: "kr",
    PLN: "zł",
    CHF: "Fr",
  };
  const cs = curSymbols[prefs.currency] ?? prefs.currency;

  const weekLabel = prefs.week_start === "sunday" ? "Svētdiena" : "Pirmdiena";

  return `${datePart} · ${timePart} · ${prefs.timezone.replace(/\//g, " / ")} · Nedēļa: ${weekLabel} · Valūtas simbols: ${cs}`;
}

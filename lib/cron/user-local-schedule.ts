/** Lokālais datums/laiks lietotāja `display_preferences.timezone`. */

export type UserLocalParts = {
  dateIso: string;
  weekday: number;
  hour: number;
  minute: number;
};

export function getUserLocalParts(timezone: string, ref = new Date()): UserLocalParts {
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(ref);
    const y = parts.find((p) => p.type === "year")?.value ?? "1970";
    const m = parts.find((p) => p.type === "month")?.value ?? "01";
    const d = parts.find((p) => p.type === "day")?.value ?? "01";
    const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
    const hour = Number.parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const minute = Number.parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    const weekdayMap: Record<string, number> = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
      Sun: 7,
    };
    return {
      dateIso: `${y}-${m}-${d}`,
      weekday: weekdayMap[wd] ?? 1,
      hour: Number.isFinite(hour) ? hour : 0,
      minute: Number.isFinite(minute) ? minute : 0,
    };
  } catch {
    const iso = ref.toISOString().slice(0, 10);
    const day = ref.getUTCDay();
    return {
      dateIso: iso,
      weekday: day === 0 ? 7 : day,
      hour: ref.getUTCHours(),
      minute: ref.getUTCMinutes(),
    };
  }
}

/** Pirmdiena, lokālais laiks 09:00–09:59 (cron ieteicams ik stundu). */
export function isWeeklySummarySendWindow(
  timezone: string,
  ref = new Date(),
): boolean {
  const p = getUserLocalParts(timezone, ref);
  return p.weekday === 1 && p.hour === 9;
}

import { getUserLocalParts } from "@/lib/cron/user-local-schedule";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Kalendāra dienu starpība starp diviem YYYY-MM-DD (neatkarīgi no TZ). */
export function calendarDaysBetween(startIso: string, endIso: string): number {
  const start = Date.parse(`${startIso}T12:00:00Z`);
  const end = Date.parse(`${endIso}T12:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return -1;
  return Math.round((end - start) / MS_PER_DAY);
}

export function lastSeenDateIsoInTimezone(
  lastSeen: string,
  timezone: string,
): string {
  return getUserLocalParts(timezone, new Date(lastSeen)).dateIso;
}

/** Pilnas kalendāra dienas kopš `last_seen` (lietotāja TZ) līdz šodienai. */
export function daysInactiveSinceLastSeen(
  lastSeen: string | null | undefined,
  timezone: string,
  ref = new Date(),
): number | null {
  if (!lastSeen?.trim()) return null;
  const seen = new Date(lastSeen);
  if (Number.isNaN(seen.getTime())) return null;
  const todayIso = getUserLocalParts(timezone, ref).dateIso;
  const seenIso = lastSeenDateIsoInTimezone(lastSeen, timezone);
  const days = calendarDaysBetween(seenIso, todayIso);
  return days >= 0 ? days : null;
}

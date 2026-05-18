/** Pirmdiena–svētdiena (ISO nedēļa, pirmdiena pirma). */
const MONDAY_FIRST_ANCHOR = new Date(1970, 0, 5);

function localeBase(locale: string): string {
  const lc = locale.trim().toLowerCase();
  if (lc === "lv" || lc.startsWith("lv-") || lc.startsWith("lv_")) return "lv";
  if (lc === "en" || lc.startsWith("en-") || lc.startsWith("en_")) return "en";
  return lc.split(/[-_]/)[0] || lc;
}

/** Īsi galvenes kalendāra šaurajā kolonnā (izvairās no Intl „short“ / dublikātiem). */
const LV_WEEKDAY_HEADERS = ["P", "O", "T", "C", "Pk", "S", "Sv"] as const;
const EN_WEEKDAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

/**
 * Nedēļas dienu galvenes kalendāram (pirmdiena–svētdiena).
 * LV: fiksēti īsi; citām valodām – `Intl` `weekday: "narrow"`.
 */
export function calendarWeekdayHeadersForIntl(locale: string): string[] {
  const base = localeBase(locale);
  if (base === "lv") return [...LV_WEEKDAY_HEADERS];
  if (base === "en") return [...EN_WEEKDAY_HEADERS];
  const wdFmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  return Array.from({ length: 7 }, (_, wiDay) => {
    const ref = new Date(MONDAY_FIRST_ANCHOR);
    ref.setDate(MONDAY_FIRST_ANCHOR.getDate() + wiDay);
    try {
      return wdFmt.format(ref);
    } catch {
      return String(wiDay + 1);
    }
  });
}

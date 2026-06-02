/** Nedēļas dienu galvenes: pirmdiena–svētdiena (kā `dashboard.js`). */
export function calendarWeekdayHeaders(locale: string): string[] {
  const lc = String(locale || "")
    .trim()
    .toLowerCase();
  if (lc === "lv" || lc.startsWith("lv-") || lc.startsWith("lv_")) {
    return ["P", "O", "T", "C", "Pk", "S", "Sv"];
  }
  if (lc === "en" || lc.startsWith("en-") || lc.startsWith("en_")) {
    return ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  }
  const wdFmt = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const out: string[] = [];
  for (let wiDay = 0; wiDay < 7; wiDay++) {
    const ref = new Date(1970, 0, 5 + wiDay);
    try {
      out.push(wdFmt.format(ref));
    } catch {
      out.push(String(wiDay + 1));
    }
  }
  return out;
}

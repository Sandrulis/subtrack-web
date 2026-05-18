/**
 * Karoga emocijkona pēc `languages.code` (ISO 639-1), lai UI valodas slēdzī būtu redzama ikona bez attēlu CDN.
 * Pilnīgi precīzs valoda→karogs nav iespējams; izmantojam ieteicamo apgabalu.
 */
const ISO639_1_TO_REGION: Record<string, string> = {
  lv: "LV",
  en: "GB",
  ru: "RU",
  de: "DE",
  fr: "FR",
  es: "ES",
  pt: "PT",
  it: "IT",
  nl: "NL",
  pl: "PL",
  fi: "FI",
  et: "EE",
  lt: "LT",
};

export function languageCodeToFlagEmoji(code: string): string {
  const primary = code.trim().toLowerCase().split("-")[0] ?? "";
  if (primary.length < 2) return "🌐";
  const region = ISO639_1_TO_REGION[primary];
  if (!region || region.length !== 2) return "🌐";
  const letters = region.toUpperCase();
  const a = 0x1f1e6;
  const oa = letters.codePointAt(0);
  const ob = letters.codePointAt(1);
  if (oa == null || ob == null || oa < 65 || oa > 90 || ob < 65 || ob > 90) {
    return "🌐";
  }
  try {
    return String.fromCodePoint(a + oa - 65, a + ob - 65);
  } catch {
    return "🌐";
  }
}

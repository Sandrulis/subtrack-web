/**
 * Tulkošanas atslēgas normalizācija (vienošanās frontend + Server Actions).
 * Atstarpes un cita `\s` aizvieto ar `_`; pēc apkopošanas kolapsē vienādos `_`.
 */

export function normalizeTranslationKeyWhileTyping(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, "_");
}

/** Saglabāšanai un serverim: arī trim + vienādi `_`. */
export function normalizeTranslationKeyStorage(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

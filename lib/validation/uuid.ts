/** Standarta UUID formāts (Supabase id). */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Stingrāks UUID variants (RFC versijas bits). */
export const UUID_STRICT_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(raw: string, strict = false): boolean {
  const re = strict ? UUID_STRICT_RE : UUID_RE;
  return re.test(raw.trim());
}

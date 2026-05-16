import type { FallbackLocaleCode } from "./fallback-schemas";
import { FALLBACK_PHRASES } from "./fallback-phrases";

const CHAIN_FALLBACK_ORDER: FallbackLocaleCode[] = ["en", "lv", "ru"];

function pickFromRow(row: Partial<Record<FallbackLocaleCode, string>>, code: string) {
  const norm = code.trim().toLowerCase();
  const asLocale = norm as FallbackLocaleCode;
  if (row[asLocale]) return row[asLocale]!;
  if (norm.startsWith("pt") && row.pt) return row.pt;
  return undefined;
}

export function pickFallbackPhrase(key: string, localeCode: string): string | undefined {
  const row = FALLBACK_PHRASES[key as keyof typeof FALLBACK_PHRASES];
  if (!row) return undefined;
  const direct = pickFromRow(row, localeCode);
  if (direct) return direct;
  for (const b of CHAIN_FALLBACK_ORDER) {
    const v = row[b];
    if (v) return v;
  }
  return undefined;
}

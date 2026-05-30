import { unstable_cache } from "next/cache";
import { createPublicAnonSupabaseClient } from "@/lib/supabase/public-anon-client";

export const SITE_TRANSLATIONS_PUBLIC_CACHE_TAG = "site-translations-public";

type Row = { translation_key: string; locale: string; value: string };

function uniqLowerChain(chain: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of chain) {
    const c = raw.trim().toLowerCase();
    if (!c || seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
}

/** kārtība pamatā līdzvērtībai: zemāk → virsāk pārraksta augstāko prioritāti. */
export function fallbackLocaleCascade(
  locale: string,
  defaultCode: string,
): string[] {
  const lc = locale.trim().toLowerCase();
  const d = defaultCode.trim().toLowerCase();
  return uniqLowerChain(["lv", "en", d, lc]);
}

async function fetchRowsForLocales(localeCodes: string[]): Promise<Row[]> {
  if (localeCodes.length === 0) {
    return [];
  }
  const supabase = createPublicAnonSupabaseClient();
  if (!supabase) {
    return [];
  }
  const { data, error } = await supabase
    .from("site_translations")
    .select("translation_key, locale, value")
    .in("locale", localeCodes);
  if (error) return [];
  return ((data ?? []) as Row[]) ?? [];
}

function mergeRows(chain: readonly string[], rows: Row[]): Record<string, string> {
  const byLoc: Record<string, Record<string, string>> = {};
  for (const r of rows) {
    const loc = r.locale.trim().toLowerCase();
    if (!byLoc[loc]) byLoc[loc] = {};
    byLoc[loc][r.translation_key] = r.value;
  }

  const out: Record<string, string> = {};
  for (const loc of chain) {
    Object.assign(out, byLoc[loc] ?? {});
  }
  return out;
}

/**
 * Public read + cache without `cookies()` when anon SELECT is enabled (`012_site_translations_select_public`).
 *
 * Allowed placeholders in stored values: `{SYSTEM_NAME}` / `{SISTEM_NAME}` – replaced when rendering via
 * `SubtrackIntlProvider` `t()` (see `applySystemNamePlaceholders`).
 */
export async function getPublicSiteTranslationsMerged(
  locale: string,
  defaultLocale: string,
): Promise<Record<string, string>> {
  const loc = locale.trim().toLowerCase();
  const def = defaultLocale.trim().toLowerCase();

  const loader = unstable_cache(
    async () => {
      const chain = fallbackLocaleCascade(loc, def);
      const rows = await fetchRowsForLocales(chain);
      return mergeRows(chain, rows);
    },
    ["subtrack-public-site-translations-map", loc, def],
    { tags: [SITE_TRANSLATIONS_PUBLIC_CACHE_TAG], revalidate: 3600 },
  );

  return loader();
}

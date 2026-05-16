import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TranslationLanguageColumn = {
  code: string;
  label: string;
  sort_order: number;
};

export type TranslationKeyRow = {
  key: string;
  byLocale: Record<string, string>;
  updated_at: string | null;
};

export type AdminTranslationsLoadResult = {
  languages: TranslationLanguageColumn[];
  rows: TranslationKeyRow[];
  loadError: string | null;
};

type LangRowRaw = {
  code: string;
  label: string;
  sort_order: number | null;
};

type TrRowRaw = {
  translation_key: string;
  locale: string;
  value: string;
  updated_at: string | null;
};

/**
 * Apvienotas valodu kolonnas + `site_translations` administratorskā UI.
 * **`cache()` no React**: dedupe tikai vienā servera rendera / pieprasījuma ietvarā (saskaņoti ar sesiju un `cookies()`).
 * Ne Next `unstable_cache` - tas nav saderīgs ar Supabase SSR klientu, kas lasa `cookies()`.
 */
export const loadAdminTranslationsData = cache(async (): Promise<AdminTranslationsLoadResult> => {
  const supabase = await createServerSupabaseClient();

  const [langsRes, trRes] = await Promise.all([
    supabase
      .from("languages")
      .select("code, label, sort_order")
      .order("sort_order", { ascending: true })
      .order("code", { ascending: true }),
    supabase.from("site_translations").select("translation_key, locale, value, updated_at"),
  ]);

  const langsError = langsRes.error;
  const trError = trRes.error;
  const loadError = langsError?.message ?? trError?.message ?? null;

  const langsRaw = (langsRes.data ?? []) as LangRowRaw[];
  const trRaw = trRes.data ?? [];

  const langs = langsRaw
    .map((r) => ({
      code: String(r.code ?? "").trim().toLowerCase(),
      label: String(r.label ?? "").trim() || String(r.code ?? "").trim(),
      sort_order: Number(r.sort_order ?? 0),
    }))
    .filter((r) => r.code.length > 0);

  const collator = new Intl.Collator("lv-LV", { sensitivity: "base" });
  langs.sort((a, b) => {
    const bySo = a.sort_order - b.sort_order;
    if (bySo !== 0) return bySo;
    const byLabel = collator.compare(a.label, b.label);
    if (byLabel !== 0) return byLabel;
    return collator.compare(a.code, b.code);
  });

  const byKey = new Map<string, { byLocale: Record<string, string>; updated_at: string | null }>();

  if (!trError && trRaw.length) {
    for (const r of trRaw as TrRowRaw[]) {
      const k = String(r.translation_key ?? "").trim();
      const loc = String(r.locale ?? "").trim().toLowerCase();
      if (!k || !loc) continue;
      if (!byKey.has(k)) {
        byKey.set(k, { byLocale: {}, updated_at: null });
      }
      const node = byKey.get(k)!;
      node.byLocale[loc] = r.value ?? "";
      const u = r.updated_at;
      if (u) {
        const prev = node.updated_at;
        if (!prev || u > prev) node.updated_at = u;
      }
    }
  }

  const sortedKeys = [...byKey.keys()].sort((a, b) => collator.compare(a, b));
  const rows: TranslationKeyRow[] = sortedKeys.map((key) => {
    const e = byKey.get(key)!;
    return {
      key,
      byLocale: e.byLocale,
      updated_at: e.updated_at,
    };
  });

  return { languages: langs, rows, loadError };
});

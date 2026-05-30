import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createPublicAnonSupabaseClient } from "@/lib/supabase/public-anon-client";

export type LanguageOption = {
  code: string;
  label: string;
};

export type LanguagesCatalog = {
  codes: string[];
  defaultCode: string;
  /** Valodu saraksts UI slēdzim (kods + nosaukums savā valodā), sakārtots pēc DB. */
  options: LanguageOption[];
};

const STATIC_FALLBACK: LanguagesCatalog = {
  codes: ["lv", "en"],
  defaultCode: "lv",
  options: [
    { code: "lv", label: "Latviešu" },
    { code: "en", label: "English" },
  ],
};

async function fetchLanguagesCatalog(): Promise<LanguagesCatalog> {
  const supabase = createPublicAnonSupabaseClient();
  if (!supabase) return STATIC_FALLBACK;
  const { data, error } = await supabase
    .from("languages")
    .select("code, label, is_default, sort_order")
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (error || !data?.length) {
    return STATIC_FALLBACK;
  }

  type Row = { code: string; label?: string; is_default?: boolean };
  const rows = data as Row[];

  const options: LanguageOption[] = [];
  for (const r of rows) {
    const code = String(r.code ?? "").trim().toLowerCase();
    if (!code) continue;
    const label = String(r.label ?? "").trim() || code.toUpperCase();
    options.push({ code, label });
  }

  const uniqueOptions: LanguageOption[] = [];
  const seen = new Set<string>();
  for (const o of options) {
    if (seen.has(o.code)) continue;
    seen.add(o.code);
    uniqueOptions.push(o);
  }

  if (uniqueOptions.length === 0) {
    return STATIC_FALLBACK;
  }

  const codes = uniqueOptions.map((o) => o.code);

  const defRow = rows.find((r) => r.is_default === true);
  const fromRow = defRow ? String(defRow.code ?? "").trim().toLowerCase() : "";

  const defaultCode =
    fromRow && codes.includes(fromRow) ? fromRow : (codes[0] ?? STATIC_FALLBACK.defaultCode);

  return {
    codes,
    defaultCode,
    options: uniqueOptions,
  };
}

/**
 * Publiski lasāms valodu katalogs (anon atslēga + RLS).
 * Kešots; pēc admin izmaiņām – `revalidateTag("languages-catalog")`.
 * `cache()` – viens izsaukums uz RSC pieprasījumu (kopā ar layout `getLanguagesCatalog`).
 */
export const getLanguagesCatalog = cache(async (): Promise<LanguagesCatalog> => {
  return unstable_cache(fetchLanguagesCatalog, ["subtrack-languages-catalog-v2"], {
    revalidate: 3600,
    tags: ["languages-catalog"],
  })();
});

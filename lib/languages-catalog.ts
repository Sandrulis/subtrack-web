import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { cache } from "react";

export type LanguagesCatalog = {
  codes: string[];
  defaultCode: string;
};

const STATIC_FALLBACK: LanguagesCatalog = {
  codes: ["lv", "en"],
  defaultCode: "lv",
};

async function fetchLanguagesCatalog(): Promise<LanguagesCatalog> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return STATIC_FALLBACK;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("languages")
    .select("code, is_default")
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (error || !data?.length) {
    return STATIC_FALLBACK;
  }

  const codes = data
    .map((r) => String((r as { code: string }).code ?? "").trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(codes)];

  const defRow = data.find((r) => (r as { is_default?: boolean }).is_default === true);
  const fromRow = defRow
    ? String((defRow as { code: string }).code ?? "").trim().toLowerCase()
    : "";

  const defaultCode =
    fromRow && unique.includes(fromRow) ? fromRow : (unique[0] ?? STATIC_FALLBACK.defaultCode);

  return {
    codes: unique.length ? unique : STATIC_FALLBACK.codes,
    defaultCode,
  };
}

/**
 * Publiski lasāms valodu katalogs (anon atslēga + RLS).
 * Kešots; pēc admin izmaiņām – `revalidateTag("languages-catalog")`.
 * `cache()` – viens izsaukums uz RSC pieprasījumu (kopā ar layout `getLanguagesCatalog`).
 */
export const getLanguagesCatalog = cache(async (): Promise<LanguagesCatalog> => {
  return unstable_cache(fetchLanguagesCatalog, ["subtrack-languages-catalog-v1"], {
    revalidate: 3600,
    tags: ["languages-catalog"],
  })();
});

"use server";

import { SITE_TRANSLATIONS_PUBLIC_CACHE_TAG } from "@/lib/site-translations-public";
import { categoryTranslationKey } from "@/lib/admin/category-translation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LangRow = { code: string; sort_order: number | null; is_default?: boolean | null };

export async function fetchCategoryLanguageMeta(): Promise<
  | { ok: true; codes: string[]; defaultCode: string }
  | { ok: false; message: string }
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("languages")
    .select("code, sort_order, is_default")
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (error) {
    return { ok: false, message: error.message };
  }

  const rows = [...((data ?? []) as LangRow[])];
  rows.sort((a, b) => {
    const so = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
    if (so !== 0) return so;
    return String(a.code).localeCompare(String(b.code), "lv");
  });

  const codes: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const c = String(r.code ?? "").trim().toLowerCase();
    if (c && !seen.has(c)) {
      seen.add(c);
      codes.push(c);
    }
  }

  const defRow = rows.find((r) => r.is_default === true);
  const fromRow = defRow ? String(defRow.code ?? "").trim().toLowerCase() : "";
  const defaultCode =
    fromRow && codes.includes(fromRow) ? fromRow : (codes[0] ?? "lv");

  return { ok: true, codes, defaultCode };
}

export async function upsertCategoryTranslationValues(
  categoryKey: string,
  valuesByLocale: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const translationKey = categoryTranslationKey(categoryKey);
  const allowedRes = await fetchCategoryLanguageMeta();
  if (!allowedRes.ok) {
    return { ok: false, message: allowedRes.message };
  }

  const allowedSet = new Set(allowedRes.codes);
  const entries = Object.entries(valuesByLocale);

  for (const [locRaw] of entries) {
    const loc = locRaw.trim().toLowerCase();
    if (!allowedSet.has(loc)) {
      return {
        ok: false,
        message: `Nepazīstams lokālis „${locRaw}”: nav valodu katalogā.`,
      };
    }
  }

  const supabase = await createServerSupabaseClient();

  for (const [locRaw, valUnknown] of entries) {
    const locale = locRaw.trim().toLowerCase();
    const value =
      typeof valUnknown === "string"
        ? valUnknown
        : valUnknown === null || valUnknown === undefined
          ? ""
          : String(valUnknown);

    if (value.length > 160) {
      return {
        ok: false,
        message: `Kategorijas nosaukums (${locale}) drīkst būt līdz 160 rakstzīmēm.`,
      };
    }

    if (!value.trim()) {
      const { error } = await supabase
        .from("site_translations")
        .delete()
        .eq("translation_key", translationKey)
        .eq("locale", locale);
      if (error) return { ok: false, message: error.message };
      continue;
    }

    const { error } = await supabase.from("site_translations").upsert(
      {
        translation_key: translationKey,
        locale,
        value: value.trim(),
      },
      { onConflict: "translation_key,locale" },
    );
    if (error) return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function deleteCategoryTranslationKey(
  categoryKey: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("site_translations")
    .delete()
    .eq("translation_key", categoryTranslationKey(categoryKey));

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

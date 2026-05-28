import { cache } from "react";
import type { TranslationLanguageColumn } from "@/lib/admin/admin-translations-data";
import { categoryTranslationKey } from "@/lib/admin/category-translation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  fetchSubscriptionCategoryCatalogRows,
  type SubscriptionCategoryCatalogRow,
} from "@/lib/subscriptions/subscription-categories-server";

export type AdminCategoryRow = SubscriptionCategoryCatalogRow & {
  translationsByLocale: Record<string, string>;
};

export type AdminCategoriesPageData = {
  rows: AdminCategoryRow[];
  languages: TranslationLanguageColumn[];
  defaultLocaleCode: string;
  loadError: string | null;
};

type LangRowRaw = {
  code: string;
  label: string;
  sort_order: number | null;
  is_default?: boolean | null;
};

type TrRowRaw = {
  translation_key: string;
  locale: string;
  value: string;
};

export const loadAdminCategoriesPageData = cache(async (): Promise<AdminCategoriesPageData> => {
  const supabase = await createServerSupabaseClient();

  const [catalog, langsRes] = await Promise.all([
    fetchSubscriptionCategoryCatalogRows(),
    supabase
      .from("languages")
      .select("code, label, sort_order, is_default")
      .order("sort_order", { ascending: true })
      .order("code", { ascending: true }),
  ]);

  const langsError = langsRes.error;
  const loadError = catalog.loadError ?? langsError?.message ?? null;

  const langsRaw = (langsRes.data ?? []) as LangRowRaw[];
  const languages: TranslationLanguageColumn[] = langsRaw
    .map((r) => ({
      code: String(r.code ?? "").trim().toLowerCase(),
      label: String(r.label ?? "").trim() || String(r.code ?? "").trim(),
      sort_order: Number(r.sort_order ?? 0),
    }))
    .filter((r) => r.code.length > 0);

  const collator = new Intl.Collator("lv-LV", { sensitivity: "base" });
  languages.sort((a, b) => {
    const bySo = a.sort_order - b.sort_order;
    if (bySo !== 0) return bySo;
    const byLabel = collator.compare(a.label, b.label);
    if (byLabel !== 0) return byLabel;
    return collator.compare(a.code, b.code);
  });

  const defRow = langsRaw.find((r) => r.is_default === true);
  const defFromRow = defRow ? String(defRow.code ?? "").trim().toLowerCase() : "";
  const defaultLocaleCode =
    defFromRow && languages.some((l) => l.code === defFromRow)
      ? defFromRow
      : (languages[0]?.code ?? "lv");

  const translationKeys = catalog.rows.map((r) => categoryTranslationKey(r.category_key));
  const translationsByKey = new Map<string, Record<string, string>>();

  if (translationKeys.length > 0 && !langsError) {
    const { data: trRows, error: trError } = await supabase
      .from("site_translations")
      .select("translation_key, locale, value")
      .in("translation_key", translationKeys);

    if (trError && !loadError) {
      return {
        rows: [],
        languages,
        defaultLocaleCode,
        loadError: trError.message,
      };
    }

    for (const raw of (trRows ?? []) as TrRowRaw[]) {
      const key = String(raw.translation_key ?? "").trim();
      const loc = String(raw.locale ?? "").trim().toLowerCase();
      const val = String(raw.value ?? "");
      if (!key || !loc) continue;
      const bucket = translationsByKey.get(key) ?? {};
      bucket[loc] = val;
      translationsByKey.set(key, bucket);
    }
  }

  const rows: AdminCategoryRow[] = catalog.rows.map((row) => ({
    ...row,
    translationsByLocale: translationsByKey.get(categoryTranslationKey(row.category_key)) ?? {},
  }));

  return { rows, languages, defaultLocaleCode, loadError };
});

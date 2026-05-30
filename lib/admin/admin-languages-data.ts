import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveRequestUiLocales } from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";

export type AdminLanguageRow = {
  id: string;
  code: string;
  label: string;
  sort_order: number;
  updated_at: string;
  is_default: boolean;
};

export type AdminLanguagesPageData = {
  rows: AdminLanguageRow[];
  loadError: string | null;
};

export const loadAdminLanguagesPageData = cache(
  async (): Promise<AdminLanguagesPageData> => {
    const supabase = await createServerSupabaseClient();
    const { locale } = await resolveRequestUiLocales();
    const collLocale = uiLocaleCodeToBcp47ForIntl(locale);

    const { data: rowsRaw, error } = await supabase
      .from("languages")
      .select("id, code, label, sort_order, updated_at, is_default")
      .order("code", { ascending: true });

    const rows = ((rowsRaw ?? []) as Omit<AdminLanguageRow, "is_default">[]).map((r) => ({
      ...r,
      is_default: (r as { is_default?: boolean | null }).is_default === true,
    }));

    try {
      const collator = new Intl.Collator(collLocale, { sensitivity: "base" });
      rows.sort((a, b) => {
        const byLabel = collator.compare(a.label, b.label);
        if (byLabel !== 0) return byLabel;
        return collator.compare(a.code, b.code);
      });
    } catch {
      rows.sort((a, b) => {
        const byLabel = a.label.localeCompare(b.label);
        if (byLabel !== 0) return byLabel;
        return a.code.localeCompare(b.code);
      });
    }

    return { rows, loadError: error?.message ?? null };
  },
);

import type { Metadata } from "next";
import { AdminLanguagesIntro } from "@/components/admin/admin-intros";
import { AdminLanguagesPanel } from "@/components/admin/admin-languages-panel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getUiPhraseForRequest,
  resolveRequestUiLocales,
} from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.languages"),
  };
}

type LanguageRowRaw = {
  id: string;
  code: string;
  label: string;
  sort_order: number;
  updated_at: string;
  is_default?: boolean | null;
};

export default async function AdminLanguagesPage() {
  const supabase = await createServerSupabaseClient();
  const { locale } = await resolveRequestUiLocales();
  const collLocale = uiLocaleCodeToBcp47ForIntl(locale);

  const { data: rowsRaw, error } = await supabase
    .from("languages")
    .select("id, code, label, sort_order, updated_at, is_default")
    .order("code", { ascending: true });

  const rows = ((rowsRaw ?? []) as LanguageRowRaw[])
    .filter((r) => r?.id != null)
    .map((r) => ({
      ...r,
      is_default: r.is_default === true,
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

  return (
    <div className="admin-page">
      <AdminLanguagesIntro />
      <AdminLanguagesPanel rows={rows} loadError={error?.message ?? null} />
    </div>
  );
}

import type { Metadata } from "next";
import { AdminPwaIntro } from "@/components/admin/admin-intros";
import { AdminPwaPanel } from "@/components/admin/admin-pwa-panel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizePwaRow } from "@/lib/pwa/public-pwa-settings";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.pwa"),
  };
}

export default async function AdminPwaPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select(
      "system_name, pwa_enabled, pwa_install_banner_enabled, pwa_install_settings_enabled, pwa_cache_revision, pwa_theme_color, pwa_background_color, pwa_short_name, updated_at",
    )
    .eq("id", 1)
    .maybeSingle();

  const systemName =
    typeof data?.system_name === "string" && data.system_name.trim()
      ? data.system_name.trim()
      : DEFAULT_SYSTEM_NAME;

  const initial = normalizePwaRow(data, systemName);
  const updatedAt =
    typeof data?.updated_at === "string" ? data.updated_at : null;

  return (
    <div className="admin-page">
      <AdminPwaIntro />
      <AdminPwaPanel
        loadError={error?.message ?? null}
        initial={initial}
        updatedAt={updatedAt}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { AdminIntegrationsIntro } from "@/components/admin/admin-intros";
import { AdminIntegrationsPanel } from "@/components/admin/admin-integrations-panel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.integrations"),
  };
}

type IntegrationRowRaw = {
  id: string;
  integration_key: string;
  label: string;
  enabled: boolean;
  updated_at: string;
};

export default async function AdminIntegrationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: rowsRaw, error } = await supabase
    .from("integrations")
    .select("id, integration_key, label, enabled, updated_at")
    .order("integration_key", { ascending: true });

  const rows = ((rowsRaw ?? []) as IntegrationRowRaw[]).filter((r) => r?.id != null);

  return (
    <div className="admin-page">
      <AdminIntegrationsIntro />
      <AdminIntegrationsPanel rows={rows} loadError={error?.message ?? null} />
    </div>
  );
}

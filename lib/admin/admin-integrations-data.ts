import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminIntegrationRow = {
  id: string;
  integration_key: string;
  label: string;
  enabled: boolean;
  updated_at: string;
};

export type AdminIntegrationsPageData = {
  rows: AdminIntegrationRow[];
  loadError: string | null;
};

export const loadAdminIntegrationsPageData = cache(
  async (): Promise<AdminIntegrationsPageData> => {
    const supabase = await createServerSupabaseClient();
    const { data: rowsRaw, error } = await supabase
      .from("integrations")
      .select("id, integration_key, label, enabled, updated_at")
      .order("integration_key", { ascending: true });

    const rows = ((rowsRaw ?? []) as AdminIntegrationRow[]).filter((r) => r?.id != null);

    return { rows, loadError: error?.message ?? null };
  },
);

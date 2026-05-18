"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import {
  normalizeStoredEmailTemplates,
  sanitizeEmailTemplatesStore,
} from "@/lib/emails/merge-template-copy";
import type { EmailTemplatesStore } from "@/lib/emails/template-types";
import { getSystemSiteName } from "@/lib/system-settings-public";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type EmailTemplateActionResult = { ok: true } | { ok: false; message: string };

export async function saveEmailTemplatesAction(
  jsonPayload: string,
): Promise<EmailTemplateActionResult> {
  await requireAdminUser();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonPayload) as unknown;
  } catch {
    return { ok: false, message: "Nederīgs JSON formāts." };
  }

  const systemName = await getSystemSiteName();
  const store = normalizeStoredEmailTemplates(
    sanitizeEmailTemplatesStore(parsed),
    systemName,
  );
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("system_settings")
    .update({ email_templates: store })
    .eq("id", 1);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/email-design");
  return { ok: true };
}

export async function loadEmailTemplatesFromDb(): Promise<EmailTemplatesStore> {
  const systemName = await getSystemSiteName();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("system_settings")
    .select("email_templates")
    .eq("id", 1)
    .maybeSingle();

  return normalizeStoredEmailTemplates(
    sanitizeEmailTemplatesStore(data?.email_templates),
    systemName,
  );
}

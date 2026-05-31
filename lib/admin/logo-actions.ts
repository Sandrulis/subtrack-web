"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { BRAND_ICON_FILES, BRAND_TOPBAR_FILE } from "@/lib/brand/logo-assets";
import { processLogoUpload, processTopbarLogoUpload } from "@/lib/brand/process-logo";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LogoActionResult =
  | { ok: true; revision: number }
  | { ok: false; message: string };

async function afterLogoMutation() {
  revalidateTag("system-settings", "default");
  revalidatePath("/admin/system");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

type LogoStorageClient =
  | { ok: true; supabase: SupabaseClient; usedServiceRole: boolean }
  | { ok: false; message: string };

async function getLogoStorageClient(): Promise<LogoStorageClient> {
  const service = createServiceRoleSupabaseClient();
  if (service) {
    return { ok: true, supabase: service, usedServiceRole: true };
  }
  const session = await createServerSupabaseClient();
  return { ok: true, supabase: session, usedServiceRole: false };
}

async function storageErrorHint(
  message: string,
  usedServiceRole: boolean,
): Promise<string> {
  if (/bucket/i.test(message)) {
    return " Palaid `database/supabase/072_brand_storage.sql`.";
  }
  if (/policy|permission|denied|403|42501|row-level security/i.test(message)) {
    if (!usedServiceRole) {
      const roleHint = await getUiPhraseForRequest("admin.forms.logo_err_service_role");
      const policyHint = await getUiPhraseForRequest("admin.forms.logo_err_storage_policy");
      return `${roleHint}${policyHint}`;
    }
    return await getUiPhraseForRequest("admin.forms.logo_err_storage_policy");
  }
  return "";
}

export async function uploadSystemLogoAction(formData: FormData): Promise<LogoActionResult> {
  await requireAdminUser();

  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return { ok: false, message: await getUiPhraseForRequest("admin.forms.logo_err_no_file") };
  }

  const processed = await processLogoUpload(file);
  if (!processed.ok) {
    return processed;
  }

  const client = await getLogoStorageClient();
  if (!client.ok) {
    return { ok: false, message: client.message };
  }
  const { supabase, usedServiceRole } = client;

  for (const item of processed.files) {
    const { error } = await supabase.storage.from("brand").upload(item.filename, item.buffer, {
      contentType: item.contentType,
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      const hint = await storageErrorHint(error.message, usedServiceRole);
      return { ok: false, message: `${error.message}${hint}` };
    }
  }

  const { data: row, error: readErr } = await supabase
    .from("system_settings")
    .select("logo_revision")
    .eq("id", 1)
    .maybeSingle();

  if (readErr) {
    const colHint = /logo_revision/i.test(readErr.message)
      ? " Palaid `database/supabase/071_system_settings_logo.sql`."
      : "";
    return { ok: false, message: `${readErr.message}${colHint}` };
  }

  const prev =
    typeof row?.logo_revision === "number"
      ? row.logo_revision
      : Number.parseInt(String(row?.logo_revision ?? "0"), 10) || 0;
  const nextRevision = prev + 1;

  const { error: updateErr } = await supabase
    .from("system_settings")
    .update({ logo_revision: nextRevision })
    .eq("id", 1);

  if (updateErr) {
    const hint = await storageErrorHint(updateErr.message, usedServiceRole);
    return { ok: false, message: `${updateErr.message}${hint}` };
  }

  await afterLogoMutation();
  return { ok: true, revision: nextRevision };
}

export async function removeSystemLogoAction(): Promise<LogoActionResult> {
  await requireAdminUser();

  const client = await getLogoStorageClient();
  if (!client.ok) {
    return { ok: false, message: client.message };
  }
  const { supabase, usedServiceRole } = client;

  const paths = [...BRAND_ICON_FILES];
  const { error: removeErr } = await supabase.storage.from("brand").remove(paths);
  if (removeErr) {
    const hint = await storageErrorHint(removeErr.message, usedServiceRole);
    return { ok: false, message: `${removeErr.message}${hint}` };
  }

  const { error } = await supabase
    .from("system_settings")
    .update({ logo_revision: 0 })
    .eq("id", 1);

  if (error) {
    const colHint = /logo_revision/i.test(error.message)
      ? " Palaid `database/supabase/071_system_settings_logo.sql`."
      : "";
    const hint = await storageErrorHint(error.message, usedServiceRole);
    return { ok: false, message: `${error.message}${colHint}${hint}` };
  }

  await afterLogoMutation();
  return { ok: true, revision: 0 };
}

export async function uploadSystemTopbarLogoAction(formData: FormData): Promise<LogoActionResult> {
  await requireAdminUser();

  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return { ok: false, message: await getUiPhraseForRequest("admin.forms.logo_err_no_file") };
  }

  const processed = await processTopbarLogoUpload(file);
  if (!processed.ok) {
    return processed;
  }

  const client = await getLogoStorageClient();
  if (!client.ok) {
    return { ok: false, message: client.message };
  }
  const { supabase, usedServiceRole } = client;

  for (const item of processed.files) {
    const { error } = await supabase.storage.from("brand").upload(item.filename, item.buffer, {
      contentType: item.contentType,
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      const hint = await storageErrorHint(error.message, usedServiceRole);
      return { ok: false, message: `${error.message}${hint}` };
    }
  }

  const { data: row, error: readErr } = await supabase
    .from("system_settings")
    .select("topbar_logo_revision")
    .eq("id", 1)
    .maybeSingle();

  if (readErr) {
    const colHint = /topbar_logo_revision/i.test(readErr.message)
      ? " Palaid `database/supabase/163_system_settings_topbar_logo.sql`."
      : "";
    return { ok: false, message: `${readErr.message}${colHint}` };
  }

  const prev =
    typeof row?.topbar_logo_revision === "number"
      ? row.topbar_logo_revision
      : Number.parseInt(String(row?.topbar_logo_revision ?? "0"), 10) || 0;
  const nextRevision = prev + 1;

  const { error: updateErr } = await supabase
    .from("system_settings")
    .update({ topbar_logo_revision: nextRevision })
    .eq("id", 1);

  if (updateErr) {
    const hint = await storageErrorHint(updateErr.message, usedServiceRole);
    return { ok: false, message: `${updateErr.message}${hint}` };
  }

  await afterLogoMutation();
  return { ok: true, revision: nextRevision };
}

export async function removeSystemTopbarLogoAction(): Promise<LogoActionResult> {
  await requireAdminUser();

  const client = await getLogoStorageClient();
  if (!client.ok) {
    return { ok: false, message: client.message };
  }
  const { supabase, usedServiceRole } = client;

  const { error: removeErr } = await supabase.storage
    .from("brand")
    .remove([BRAND_TOPBAR_FILE]);
  if (removeErr) {
    const hint = await storageErrorHint(removeErr.message, usedServiceRole);
    return { ok: false, message: `${removeErr.message}${hint}` };
  }

  const { error } = await supabase
    .from("system_settings")
    .update({ topbar_logo_revision: 0 })
    .eq("id", 1);

  if (error) {
    const colHint = /topbar_logo_revision/i.test(error.message)
      ? " Palaid `database/supabase/163_system_settings_topbar_logo.sql`."
      : "";
    const hint = await storageErrorHint(error.message, usedServiceRole);
    return { ok: false, message: `${error.message}${colHint}${hint}` };
  }

  await afterLogoMutation();
  return { ok: true, revision: 0 };
}

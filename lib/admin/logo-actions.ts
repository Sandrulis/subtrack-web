"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { BRAND_STORAGE_FILES } from "@/lib/brand/logo-assets";
import { processLogoUpload } from "@/lib/brand/process-logo";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

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

  const supabase = await createServerSupabaseClient();

  for (const item of processed.files) {
    const { error } = await supabase.storage.from("brand").upload(item.filename, item.buffer, {
      contentType: item.contentType,
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) {
      let hint = "";
      if (/bucket/i.test(error.message)) {
        hint = " Palaid `database/supabase/072_brand_storage.sql`.";
      } else if (/policy|permission|denied|403|42501/i.test(error.message)) {
        hint = await getUiPhraseForRequest("admin.forms.logo_err_storage_policy");
      }
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
    return { ok: false, message: updateErr.message };
  }

  await afterLogoMutation();
  return { ok: true, revision: nextRevision };
}

export async function removeSystemLogoAction(): Promise<LogoActionResult> {
  await requireAdminUser();

  const supabase = await createServerSupabaseClient();

  const paths = [...BRAND_STORAGE_FILES];
  await supabase.storage.from("brand").remove(paths);

  const { error } = await supabase
    .from("system_settings")
    .update({ logo_revision: 0 })
    .eq("id", 1);

  if (error) {
    const colHint = /logo_revision/i.test(error.message)
      ? " Palaid `database/supabase/071_system_settings_logo.sql`."
      : "";
    return { ok: false, message: `${error.message}${colHint}` };
  }

  await afterLogoMutation();
  return { ok: true, revision: 0 };
}

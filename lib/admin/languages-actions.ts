"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { validUuid } from "@/lib/admin/form-helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LanguagesActionResult =
  | { ok: true }
  | { ok: false; message: string };

const CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateCode(raw: string): string | null {
  const code = normalizeCode(raw);
  if (!code || code.length < 2 || code.length > 24) {
    return "Valodas kodam jābūt 2-24 rakstzīmes garam (latinas burti/cipari/defisi).";
  }
  if (!CODE_PATTERN.test(code)) {
    return "Pieļauts formāts, piem. en, lv, pt-br (mazie burti, defisi kā segmentu atdalītājam).";
  }
  return null;
}

function validateLabel(raw: string): string | null {
  const label = raw.trim();
  if (!label) {
    return "Ievadi nosaukumu (vismaz viens simbols).";
  }
  if (label.length > 120) {
    return "Nosaukums drīkst būt līdz 120 rakstzīmēm.";
  }
  return null;
}

function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase();
}

function validateSort(raw: unknown): number | string {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
  if (!Number.isInteger(n) || n < 0 || n > 2_147_483_647) {
    return "Secībai jābūt veselam navnegatīvam skaitlim.";
  }
  return n;
}

async function afterLanguagesMutation() {
  revalidatePath("/admin/languages");
  revalidateTag("languages-catalog", "default");
  revalidatePath("/admin/translations");
}

export async function createLanguageAction(
  formData: FormData,
): Promise<LanguagesActionResult> {
  await requireAdminUser();

  const codeRaw = String(formData.get("code") ?? "");
  const labelRaw = String(formData.get("label") ?? "");
  const sortRaw = validateSort(formData.get("sort_order"));
  const codeErr = validateCode(codeRaw);
  const labelErr = validateLabel(labelRaw);

  const errs = [codeErr, labelErr, typeof sortRaw === "string" ? sortRaw : null].filter(
    Boolean,
  ) as string[];
  if (errs.length) return { ok: false, message: errs[0]! };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("languages").insert({
    code: normalizeCode(codeRaw),
    label: labelRaw.trim(),
    sort_order: sortRaw as number,
  });

  if (error) {
    if (/duplicate key|unique constraint/i.test(error.message)) {
      return { ok: false, message: "Šāds valodas kods jau pastāvē." };
    }
    return { ok: false, message: error.message };
  }

  await afterLanguagesMutation();
  return { ok: true };
}

export async function setDefaultLanguageAction(
  formData: FormData,
): Promise<LanguagesActionResult> {
  await requireAdminUser();

  const id = String(formData.get("id") ?? "").trim();
  if (!validUuid(id)) {
    return { ok: false, message: "Nederīgs ieraksta identifikātors." };
  }

  const supabase = await createServerSupabaseClient();

  const clear = await supabase.from("languages").update({ is_default: false }).neq("id", id);
  if (clear.error) {
    return { ok: false, message: clear.error.message };
  }

  const set = await supabase.from("languages").update({ is_default: true }).eq("id", id);
  if (set.error) {
    return { ok: false, message: set.error.message };
  }

  await afterLanguagesMutation();
  return { ok: true };
}

export async function updateLanguageAction(
  formData: FormData,
): Promise<LanguagesActionResult> {
  await requireAdminUser();

  const id = String(formData.get("id") ?? "").trim();
  if (!validUuid(id)) {
    return { ok: false, message: "Nederīgs ieraksta identifikātors." };
  }

  const codeRaw = String(formData.get("code") ?? "");
  const labelRaw = String(formData.get("label") ?? "");
  const sortRaw = validateSort(formData.get("sort_order"));

  const codeErr = validateCode(codeRaw);
  const labelErr = validateLabel(labelRaw);
  const errs = [codeErr, labelErr, typeof sortRaw === "string" ? sortRaw : null].filter(
    Boolean,
  ) as string[];
  if (errs.length) return { ok: false, message: errs[0]! };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("languages")
    .update({
      code: normalizeCode(codeRaw),
      label: labelRaw.trim(),
      sort_order: sortRaw as number,
    })
    .eq("id", id);

  if (error) {
    if (/duplicate key|unique constraint/i.test(error.message)) {
      return { ok: false, message: "Šāds valodas kods jau pastāvē." };
    }
    return { ok: false, message: error.message };
  }

  await afterLanguagesMutation();
  return { ok: true };
}

export async function deleteLanguageAction(
  formData: FormData,
): Promise<LanguagesActionResult> {
  await requireAdminUser();

  const id = String(formData.get("id") ?? "").trim();
  if (!validUuid(id)) {
    return { ok: false, message: "Nederīgs ieraksta identifikātors." };
  }

  const supabase = await createServerSupabaseClient();

  const { data: row, error: loadErr } = await supabase
    .from("languages")
    .select("is_default")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) {
    return { ok: false, message: loadErr.message };
  }
  if (row && (row as { is_default?: boolean }).is_default === true) {
    return {
      ok: false,
      message:
        "Nevar dzēst sistēmas noklusējuma valodu. Vispirms norādi citu valodu kā noklusējumu pirmajai ierašanās reizei.",
    };
  }

  const { error } = await supabase.from("languages").delete().eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  await afterLanguagesMutation();
  return { ok: true };
}

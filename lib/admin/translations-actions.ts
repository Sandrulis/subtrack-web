"use server";

import { SITE_TRANSLATIONS_PUBLIC_CACHE_TAG } from "@/lib/site-translations-public";
import { normalizeTranslationKeyStorage } from "@/lib/admin/translation-key-normalize";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TranslationsActionResult =
  | { ok: true }
  | { ok: false; message: string };

const KEY_PATTERN = /^[a-z0-9][a-z0-9_.]*$/;

function normalizeKey(raw: string): string {
  return normalizeTranslationKeyStorage(raw);
}

function validateTranslationKey(norm: string): string | null {
  if (!norm || norm.length < 1 || norm.length > 200) {
    return "Atslēgai jābūt 1 līdz 200 rakstzīmēm pēc normalizācijas.";
  }
  if (!KEY_PATTERN.test(norm)) {
    return (
      'Atļautas mazie latīņu burti, cipari, zemsvītra „_" un punkts kā atdalītājs ' +
      "( piemēram plan.title vai auth_login )."
    );
  }
  return null;
}

async function invalidateTranslationsUI() {
  revalidatePath("/admin/translations");
  revalidateTag(SITE_TRANSLATIONS_PUBLIC_CACHE_TAG, "default");
}

type LangRow = { code: string; sort_order: number | null };

async function fetchLanguageCodesSorted(): Promise<
  { ok: true; codes: string[] } | { ok: false; message: string }
> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("languages")
    .select("code, sort_order")
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (error) {
    return { ok: false, message: error.message };
  }

  const rows = [...((data ?? []) as LangRow[])];
  rows.sort((a, b) => {
    const so = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
    if (so !== 0) return so;
    return String(a.code).localeCompare(String(b.code), "lv");
  });

  const codes: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const c = String(r.code ?? "").trim().toLowerCase();
    if (c && !seen.has(c)) {
      seen.add(c);
      codes.push(c);
    }
  }

  return { ok: true, codes };
}

/** valuesJson: `{ "locale": "teksts", … }` tikai kā `languages.code`; tukša vērtība dzēš ierakstu. */
export async function upsertTranslationValuesAction(
  formData: FormData,
): Promise<TranslationsActionResult> {
  await requireAdminUser();

  const keyNorm = normalizeKey(String(formData.get("translation_key") ?? ""));
  const keyErr = validateTranslationKey(keyNorm);
  if (keyErr) return { ok: false, message: keyErr };

  const rawJson = String(formData.get("values_json") ?? "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    return { ok: false, message: "Nepareizs JSON lauksām vērtībām." };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: 'Vērtību formātam jābūt objektam `{ "locale": "teksts" }`.' };
  }

  const allowedRes = await fetchLanguageCodesSorted();
  if (!allowedRes.ok) {
    return { ok: false, message: `Neizdevās lasīt valodas: ${allowedRes.message}` };
  }
  const allowedSet = new Set(allowedRes.codes);
  const entries = Object.entries(parsed as Record<string, unknown>);

  for (const [locRaw] of entries) {
    const loc = locRaw.trim().toLowerCase();
    if (!allowedSet.has(loc)) {
      return {
        ok: false,
        message: `Nepazīstams lokālis „${locRaw}”: nav ietvertajā valodu katalogā.`,
      };
    }
  }

  const supabase = await createServerSupabaseClient();

  for (const [locRaw, valUnknown] of entries) {
    const locale = locRaw.trim().toLowerCase();
    const value =
      typeof valUnknown === "string"
        ? valUnknown
        : valUnknown === null || valUnknown === undefined
          ? ""
          : String(valUnknown);

    if (value.length > 10_000) {
      return {
        ok: false,
        message: `Tulkojuma garums vienā valodā nevar pārsniegt 10 000 rakstzīmes (${locale}).`,
      };
    }

    if (!value.trim()) {
      const { error } = await supabase
        .from("site_translations")
        .delete()
        .eq("translation_key", keyNorm)
        .eq("locale", locale);
      if (error) {
        return { ok: false, message: error.message };
      }
      continue;
    }

    const { error } = await supabase.from("site_translations").upsert(
      {
        translation_key: keyNorm,
        locale,
        value,
      },
      { onConflict: "translation_key,locale" },
    );

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  await invalidateTranslationsUI();
  return { ok: true };
}

export async function deleteTranslationKeyAction(
  formData: FormData,
): Promise<TranslationsActionResult> {
  await requireAdminUser();

  const keyNorm = normalizeKey(String(formData.get("translation_key") ?? ""));
  const keyErr = validateTranslationKey(keyNorm);
  if (keyErr) return { ok: false, message: keyErr };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("site_translations").delete().eq("translation_key", keyNorm);

  if (error) {
    return { ok: false, message: error.message };
  }

  await invalidateTranslationsUI();
  return { ok: true };
}

"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import {
  pickCategoryCatalogLabel,
} from "@/lib/admin/category-translation";
import {
  deleteCategoryTranslationKey,
  fetchCategoryLanguageMeta,
  upsertCategoryTranslationValues,
} from "@/lib/admin/category-translations-actions";
import { SITE_TRANSLATIONS_PUBLIC_CACHE_TAG } from "@/lib/site-translations-public";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  normalizeAdminKey,
  readFormString,
  validUuid,
  validateAdminLabel,
} from "@/lib/admin/form-helpers";
export type CategoriesActionResult = { ok: true } | { ok: false; message: string };

const CATEGORY_KEY_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

function normalizeKey(raw: string): string {
  return normalizeAdminKey(raw);
}

function validateLabel(raw: string): string | null {
  return validateAdminLabel(
    raw,
    "Norādi kategorijas nosaukumu vismaz noklusējuma valodā.",
  );
}

function parseValuesJson(raw: string): Record<string, string> | string {
  if (!raw.trim()) return "Norādi tulkojumus vismās valodās.";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return "Nepareizs tulkojumu JSON.";
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return 'Tulkojumu formātam jābūt objektam `{ "lv": "…", "en": "…" }`.';
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    out[k.trim().toLowerCase()] =
      typeof v === "string" ? v : v == null ? "" : String(v);
  }
  return out;
}

async function resolveLabelFromTranslations(
  valuesJson: string,
): Promise<{ ok: true; byLocale: Record<string, string>; label: string } | { ok: false; message: string }> {
  const parsed = parseValuesJson(valuesJson);
  if (typeof parsed === "string") return { ok: false, message: parsed };

  const meta = await fetchCategoryLanguageMeta();
  if (!meta.ok) return { ok: false, message: meta.message };

  const label = pickCategoryCatalogLabel(parsed, meta.defaultCode);
  if (!label) {
    return {
      ok: false,
      message: `Norādi nosaukumu vismaz valodā „${meta.defaultCode}”.`,
    };
  }

  const defaultVal = (parsed[meta.defaultCode] ?? "").trim();
  const labelErr = validateLabel(defaultVal || label);
  if (labelErr) return { ok: false, message: labelErr };

  return { ok: true, byLocale: parsed, label };
}

function validateKey(raw: string): string | null {
  const k = normalizeKey(raw);
  if (!k) return "Norādi tehnisko atslēgu (category_key).";
  if (!CATEGORY_KEY_PATTERN.test(k)) {
    return (
      "Atslēgai jāsākas ar mazā burta un drīkst saturēt tikai [a-z0-9_] (garums 2-64)."
    );
  }
  return null;
}

async function afterCategoriesMutation() {
  revalidatePath("/admin/categories");
  revalidatePath("/dashboard");
  revalidatePath("/demo/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/demo/analytics");
  revalidateTag("subscription-categories", "default");
  revalidateTag(SITE_TRANSLATIONS_PUBLIC_CACHE_TAG, "default");
}

async function nextCategorySortOrder(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<number> {
  const { data } = await supabase
    .from("subscription_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const max = (data as { sort_order?: number } | null)?.sort_order;
  const base = typeof max === "number" && Number.isFinite(max) ? max : 0;
  return base + 10;
}

export async function createCategoryAction(
  formData: FormData,
): Promise<CategoriesActionResult> {
  await requireAdminUser();

  const category_key_raw = String(formData.get("category_key") ?? "");
  const valuesJson = String(formData.get("values_json") ?? "");
  const enabledRaw = String(formData.get("enabled") ?? "");
  const enabled = enabledRaw === "true" || enabledRaw === "on" || enabledRaw === "1";

  const keyErr = validateKey(category_key_raw);
  const trRes = await resolveLabelFromTranslations(valuesJson);
  if (keyErr) return { ok: false, message: keyErr };
  if (!trRes.ok) return { ok: false, message: trRes.message };

  const categoryKey = normalizeKey(category_key_raw);
  const supabase = await createServerSupabaseClient();
  const sort_order = await nextCategorySortOrder(supabase);
  const { error } = await supabase.from("subscription_categories").insert({
    category_key: categoryKey,
    label: trRes.label,
    sort_order,
    enabled,
  });

  if (error) {
    if (/duplicate key|unique constraint/i.test(error.message)) {
      return { ok: false, message: "Šāda kategorijas atslēga jau pastāvē." };
    }
    const msg =
      /relation .* does not exist/i.test(error.message) ||
      /schema cache/i.test(error.message)
        ? "Migrācija database/supabase/131_subscription_categories.sql vēl nav palaista."
        : error.message;
    return { ok: false, message: msg };
  }

  const upsert = await upsertCategoryTranslationValues(categoryKey, trRes.byLocale);
  if (!upsert.ok) {
    await supabase.from("subscription_categories").delete().eq("category_key", categoryKey);
    return upsert;
  }

  await afterCategoriesMutation();
  return { ok: true };
}

export async function updateCategoryAction(
  formData: FormData,
): Promise<CategoriesActionResult> {
  await requireAdminUser();

  const id = readFormString(formData, "id");
  if (!validUuid(id)) {
    return { ok: false, message: "Nederīgs kategorijas ieraksta id." };
  }

  const valuesJson = String(formData.get("values_json") ?? "");
  const trRes = await resolveLabelFromTranslations(valuesJson);
  if (!trRes.ok) return trRes;

  const supabase = await createServerSupabaseClient();
  const { data: existing, error: loadErr } = await supabase
    .from("subscription_categories")
    .select("category_key")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) return { ok: false, message: loadErr.message };
  if (!existing) return { ok: false, message: "Kategorija nav atrasta." };

  const categoryKey = String((existing as { category_key?: string }).category_key ?? "").trim();
  const { error } = await supabase
    .from("subscription_categories")
    .update({
      label: trRes.label,
    })
    .eq("id", id);

  if (error) {
    const msg =
      /relation .* does not exist/i.test(error.message)
        ? "Migrācija database/supabase/131_subscription_categories.sql vēl nav palaista."
        : error.message;
    return { ok: false, message: msg };
  }

  const upsert = await upsertCategoryTranslationValues(categoryKey, trRes.byLocale);
  if (!upsert.ok) return upsert;

  await afterCategoriesMutation();
  return { ok: true };
}

export async function setCategoryEnabledAction(
  formData: FormData,
): Promise<CategoriesActionResult> {
  await requireAdminUser();

  const id = readFormString(formData, "id");
  if (!validUuid(id)) {
    return { ok: false, message: "Nederīgs kategorijas ieraksta id." };
  }
  const raw = String(formData.get("enabled") ?? "").trim().toLowerCase();
  const enabled = raw === "true" || raw === "on" || raw === "1";

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("subscription_categories")
    .update({ enabled })
    .eq("id", id);

  if (error) {
    const msg =
      /relation .* does not exist/i.test(error.message)
        ? "Migrācija database/supabase/131_subscription_categories.sql vēl nav palaista."
        : error.message;
    return { ok: false, message: msg };
  }

  await afterCategoriesMutation();
  return { ok: true };
}

export async function deleteCategoryAction(
  formData: FormData,
): Promise<CategoriesActionResult> {
  await requireAdminUser();

  const id = readFormString(formData, "id");
  if (!validUuid(id)) {
    return { ok: false, message: "Nederīgs kategorijas ieraksta id." };
  }

  const supabase = await createServerSupabaseClient();

  const { data: row, error: loadErr } = await supabase
    .from("subscription_categories")
    .select("category_key")
    .eq("id", id)
    .maybeSingle();

  if (loadErr) {
    return { ok: false, message: loadErr.message };
  }
  if (!row) {
    return { ok: false, message: "Kategorija nav atrasta." };
  }

  const categoryKey = String((row as { category_key?: string }).category_key ?? "").trim();
  if (categoryKey) {
    const { count, error: countErr } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .ilike("category", categoryKey);

    if (countErr) {
      return { ok: false, message: countErr.message };
    }
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        message:
          "Nevar dzēst kategoriju, kamēr ar to ir saistīti maksājumi. Vispirms pārceļ ierakstus uz citu kategoriju vai izslēdz kategoriju.",
      };
    }
  }

  const { error } = await supabase.from("subscription_categories").delete().eq("id", id);

  if (error) {
    const msg =
      /relation .* does not exist/i.test(error.message)
        ? "Migrācija database/supabase/131_subscription_categories.sql vēl nav palaista."
        : error.message;
    return { ok: false, message: msg };
  }

  if (categoryKey) {
    const delTr = await deleteCategoryTranslationKey(categoryKey);
    if (!delTr.ok) return delTr;
  }

  await afterCategoriesMutation();
  return { ok: true };
}

export async function reorderCategoriesAction(
  orderedIds: string[],
): Promise<CategoriesActionResult> {
  await requireAdminUser();
  if (!orderedIds.length) return { ok: true };

  const supabase = await createServerSupabaseClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i]!.trim();
    if (!validUuid(id)) {
      return { ok: false, message: "Nederīgs kategorijas ieraksta id." };
    }
    const { error } = await supabase
      .from("subscription_categories")
      .update({ sort_order: i * 10 })
      .eq("id", id);
    if (error) {
      const msg =
        /relation .* does not exist/i.test(error.message)
          ? "Migrācija database/supabase/131_subscription_categories.sql vēl nav palaista."
          : error.message;
      return { ok: false, message: msg };
    }
  }

  await afterCategoriesMutation();
  return { ok: true };
}

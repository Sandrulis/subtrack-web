"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeHexColor } from "@/lib/pwa/public-pwa-settings";

export type PwaSettingsActionResult = { ok: true } | { ok: false; message: string };

function readFormBool(formData: FormData, key: string): boolean {
  const v = String(formData.get(key) ?? "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function readOptionalHex(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const norm = normalizeHexColor(raw, "");
  return norm.length > 0 ? norm : null;
}

async function afterPwaMutation() {
  revalidateTag("system-settings", "default");
  revalidatePath("/admin/pwa");
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function savePwaSettingsAction(
  formData: FormData,
): Promise<PwaSettingsActionResult> {
  await requireAdminUser();

  const pwa_enabled = readFormBool(formData, "pwa_enabled");
  const pwa_install_banner_enabled = readFormBool(formData, "pwa_install_banner_enabled");
  const pwa_install_settings_enabled = readFormBool(formData, "pwa_install_settings_enabled");

  const shortRaw = String(formData.get("pwa_short_name") ?? "").trim();
  const pwa_short_name = shortRaw.length > 0 ? shortRaw.slice(0, 12) : null;

  const themeRaw = String(formData.get("pwa_theme_color") ?? "").trim();
  if (themeRaw && normalizeHexColor(themeRaw, "") === "") {
    return { ok: false, message: "Nederīga theme_color (formāts #RRGGBB)." };
  }
  const bgRaw = String(formData.get("pwa_background_color") ?? "").trim();
  if (bgRaw && normalizeHexColor(bgRaw, "") === "") {
    return { ok: false, message: "Nederīga background_color (formāts #RRGGBB)." };
  }

  const pwa_theme_color = readOptionalHex(formData, "pwa_theme_color");
  const pwa_background_color = readOptionalHex(formData, "pwa_background_color");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("system_settings")
    .update({
      pwa_enabled,
      pwa_install_banner_enabled: pwa_enabled ? pwa_install_banner_enabled : false,
      pwa_install_settings_enabled: pwa_enabled ? pwa_install_settings_enabled : false,
      pwa_short_name,
      pwa_theme_color,
      pwa_background_color,
    })
    .eq("id", 1);

  if (error) {
    return { ok: false, message: error.message };
  }

  await afterPwaMutation();
  return { ok: true };
}

export async function bumpPwaCacheRevisionAction(): Promise<PwaSettingsActionResult> {
  await requireAdminUser();
  const supabase = await createServerSupabaseClient();

  const { data, error: readErr } = await supabase
    .from("system_settings")
    .select("pwa_cache_revision")
    .eq("id", 1)
    .maybeSingle();

  if (readErr) {
    return { ok: false, message: readErr.message };
  }

  const current =
    typeof data?.pwa_cache_revision === "number" ? data.pwa_cache_revision : 1;

  const { error } = await supabase
    .from("system_settings")
    .update({ pwa_cache_revision: current + 1 })
    .eq("id", 1);

  if (error) {
    return { ok: false, message: error.message };
  }

  await afterPwaMutation();
  return { ok: true };
}

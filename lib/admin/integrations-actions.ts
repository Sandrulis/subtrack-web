"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type IntegrationsActionResult = { ok: true } | { ok: false; message: string };

const INTEGRATION_KEY_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readFormString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function validUuid(raw: string): boolean {
  return UUID_RE.test(raw.trim());
}

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase();
}

function validateLabel(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Norādi integrācijas nosaukumu.";
  if (t.length > 160) return "Nosaukums drīkst būt līdz 160 rakstzīmēm.";
  return null;
}

function validateKey(raw: string): string | null {
  const k = normalizeKey(raw);
  if (!k) return "Norādi tehnisko atslēgu (integration_key).";
  if (!INTEGRATION_KEY_PATTERN.test(k)) {
    return (
      "Atslēgai jāsākas ar mazā burta un drīkst saturēt tikai [a-z0-9_] (garums 2-64)."
    );
  }
  return null;
}

async function afterIntegrationsMutation() {
  revalidatePath("/admin/integrations");
  revalidatePath("/login");
  revalidatePath("/signup");
}

export async function createIntegrationAction(
  formData: FormData,
): Promise<IntegrationsActionResult> {
  await requireAdminUser();

  const integration_key_raw = String(formData.get("integration_key") ?? "");
  const labelRaw = String(formData.get("label") ?? "");
  const enabledRaw = String(formData.get("enabled") ?? "");
  const enabled = enabledRaw === "true" || enabledRaw === "on" || enabledRaw === "1";

  const keyErr = validateKey(integration_key_raw);
  const labelErr = validateLabel(labelRaw);
  const first = keyErr ?? labelErr;
  if (first) return { ok: false, message: first };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("integrations").insert({
    integration_key: normalizeKey(integration_key_raw),
    label: labelRaw.trim(),
    enabled,
  });

  if (error) {
    if (/duplicate key|unique constraint/i.test(error.message)) {
      return { ok: false, message: "Šāda integrācijas atslēga jau pastāvē." };
    }
    const msg =
      /relation .* does not exist/i.test(error.message) || /schema cache/i.test(error.message)
        ? "Migrācija database/supabase/024_integrations.sql vēl nav palaista."
        : error.message;
    return { ok: false, message: msg };
  }

  await afterIntegrationsMutation();
  return { ok: true };
}

export async function updateIntegrationLabelAction(
  formData: FormData,
): Promise<IntegrationsActionResult> {
  await requireAdminUser();

  const id = readFormString(formData, "id");
  if (!validUuid(id)) {
    return { ok: false, message: "Nederīgs integrācijas ieraksta id." };
  }
  const labelRaw = String(formData.get("label") ?? "");
  const labelErr = validateLabel(labelRaw);
  if (labelErr) return { ok: false, message: labelErr };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("integrations")
    .update({ label: labelRaw.trim() })
    .eq("id", id);

  if (error) {
    const msg =
      /relation .* does not exist/i.test(error.message)
        ? "Migrācija database/supabase/024_integrations.sql vēl nav palaista."
        : error.message;
    return { ok: false, message: msg };
  }

  await afterIntegrationsMutation();
  return { ok: true };
}

export async function setIntegrationEnabledAction(
  formData: FormData,
): Promise<IntegrationsActionResult> {
  await requireAdminUser();

  const id = readFormString(formData, "id");
  if (!validUuid(id)) {
    return { ok: false, message: "Nederīgs integrācijas ieraksta id." };
  }
  const raw = String(formData.get("enabled") ?? "").trim().toLowerCase();
  const enabled = raw === "true" || raw === "on" || raw === "1";

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("integrations").update({ enabled }).eq("id", id);

  if (error) {
    const msg =
      /relation .* does not exist/i.test(error.message)
        ? "Migrācija database/supabase/024_integrations.sql vēl nav palaista."
        : error.message;
    return { ok: false, message: msg };
  }

  await afterIntegrationsMutation();
  return { ok: true };
}

export async function deleteIntegrationAction(
  formData: FormData,
): Promise<IntegrationsActionResult> {
  await requireAdminUser();

  const id = readFormString(formData, "id");
  if (!validUuid(id)) {
    return { ok: false, message: "Nederīgs integrācijas ieraksta id." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("integrations").delete().eq("id", id);

  if (error) {
    const msg =
      /relation .* does not exist/i.test(error.message)
        ? "Migrācija database/supabase/024_integrations.sql vēl nav palaista."
        : error.message;
    return { ok: false, message: msg };
  }

  await afterIntegrationsMutation();
  return { ok: true };
}

"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  sanitizeDisplayPreferencesPartial,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";

export type SystemSettingsActionResult = { ok: true } | { ok: false; message: string };

const TIMEZONES = new Set<string>([
  "Europe/Riga",
  "Europe/Tallinn",
  "Europe/Vilnius",
  "Europe/Helsinki",
  "Europe/Warsaw",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/London",
  "UTC",
  "America/New_York",
]);

function readFormString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function validateSystemName(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Norādi sistēmas nosaukumu.";
  if (t.length > 120) return "Nosaukums drīkst būt līdz 120 rakstzīmēm.";
  return null;
}

function buildPrefsFromForm(formData: FormData): Partial<DisplayPreferences> {
  const raw = {
    currency: readFormString(formData, "currency"),
    date_order: readFormString(formData, "date_order"),
    date_sep: readFormString(formData, "date_sep"),
    time_format: readFormString(formData, "time_format"),
    time_sep: readFormString(formData, "time_sep"),
    timezone: readFormString(formData, "timezone"),
    week_start: readFormString(formData, "week_start"),
  };
  return sanitizeDisplayPreferencesPartial(raw);
}

async function afterSystemSettingsMutation() {
  revalidateTag("system-settings", "default");
  revalidatePath("/admin/system");
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function saveSystemSettingsAction(
  formData: FormData,
): Promise<SystemSettingsActionResult> {
  await requireAdminUser();

  const system_name = readFormString(formData, "system_name");
  const nameErr = validateSystemName(system_name);
  if (nameErr) return { ok: false, message: nameErr };

  const partial = buildPrefsFromForm(formData);
  const tzFromForm = readFormString(formData, "timezone");
  if (tzFromForm && !TIMEZONES.has(tzFromForm)) {
    return { ok: false, message: "Nederīga laika zonas izvēle." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("system_settings")
    .update({
      system_name,
      default_display_preferences: partial,
    })
    .eq("id", 1);

  if (error) {
    const msg =
      /relation .* does not exist/i.test(error.message) || /schema cache/i.test(error.message)
        ? "Migrācija `database/supabase/012_system_settings.sql` vēl nav palaista."
        : error.message;
    return { ok: false, message: msg };
  }

  await afterSystemSettingsMutation();
  return { ok: true };
}

"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";
import { parsePaidPlanPriceField } from "@/lib/paid-plan-annual";
import { parseLifetimeEndsAtFromForm } from "@/lib/paid-plan-lifetime";
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

function readFormBool(formData: FormData, key: string): boolean {
  const v = String(formData.get(key) ?? "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function validateSystemName(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Norādi sistēmas nosaukumu.";
  if (t.length > 120) return "Nosaukums drīkst būt līdz 120 rakstzīmēm.";
  return null;
}

function validateSupportContactEmail(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.length > 254) return "Atbalsta e-pasts drīkst būt līdz 254 rakstzīmēm.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) {
    return "Norādi derīgu atbalsta e-pasta adresi vai atstāj lauku tukšu.";
  }
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

  const support_contact_email = readFormString(formData, "support_contact_email");
  const supportEmailErr = validateSupportContactEmail(support_contact_email);
  if (supportEmailErr) return { ok: false, message: supportEmailErr };

  const partial = buildPrefsFromForm(formData);
  const tzFromForm = readFormString(formData, "timezone");
  if (tzFromForm && !TIMEZONES.has(tzFromForm)) {
    return { ok: false, message: "Nederīga laika zonas izvēle." };
  }

  const paid_plan_enabled = readFormBool(formData, "paid_plan_enabled");
  const pro_trial_enabled =
    paid_plan_enabled && readFormBool(formData, "pro_trial_enabled");
  const trialDaysRaw = readFormString(formData, "pro_trial_days");
  if (pro_trial_enabled) {
    if (!/^\d+$/.test(trialDaysRaw)) {
      return {
        ok: false,
        message: await getUiPhraseForRequest("admin.forms.err_pro_trial_days"),
      };
    }
    const trialDays = Number.parseInt(trialDaysRaw, 10);
    if (trialDays < 1 || trialDays > 365) {
      return {
        ok: false,
        message: await getUiPhraseForRequest("admin.forms.err_pro_trial_days"),
      };
    }
  }

  const paid_plan_annual_enabled =
    paid_plan_enabled && readFormBool(formData, "paid_plan_annual_enabled");
  const priceStr = readFormString(formData, "paid_plan_price_eur").replace(",", ".");
  const price = Number.parseFloat(priceStr);
  if (!Number.isFinite(price) || price < 0.01 || price > 9999.99) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("admin.forms.err_paid_plan_price"),
    };
  }
  const limitRaw = readFormString(formData, "paid_plan_free_subscription_limit");
  if (!/^\d+$/.test(limitRaw)) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("admin.forms.err_paid_plan_limit"),
    };
  }
  const limit = Number.parseInt(limitRaw, 10);
  if (limit > 100000) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("admin.forms.err_paid_plan_limit"),
    };
  }

  let paid_plan_annual_price_eur: number | null = null;
  if (paid_plan_annual_enabled) {
    const annualStr = readFormString(formData, "paid_plan_annual_price_eur").replace(",", ".");
    if (annualStr !== "") {
      const annualParsed = parsePaidPlanPriceField(annualStr);
      if (annualParsed == null) {
        return {
          ok: false,
          message: await getUiPhraseForRequest("admin.forms.err_paid_plan_annual_price"),
        };
      }
      paid_plan_annual_price_eur = annualParsed;
    }
  }

  const paid_plan_lifetime_enabled =
    paid_plan_enabled && readFormBool(formData, "paid_plan_lifetime_enabled");
  let paid_plan_lifetime_price_eur: number | null = null;
  let paid_plan_lifetime_ends_at: string | null = null;
  let paid_plan_lifetime_purchase_limit: number | null = null;
  if (paid_plan_lifetime_enabled) {
    const lifetimePriceStr = readFormString(formData, "paid_plan_lifetime_price_eur").replace(
      ",",
      ".",
    );
    const lifetimePrice = parsePaidPlanPriceField(lifetimePriceStr);
    if (lifetimePrice == null) {
      return {
        ok: false,
        message: await getUiPhraseForRequest("admin.forms.err_paid_plan_lifetime_price"),
      };
    }
    paid_plan_lifetime_price_eur = lifetimePrice;

    const endsRaw = readFormString(formData, "paid_plan_lifetime_ends_at");
    if (endsRaw) {
      paid_plan_lifetime_ends_at = parseLifetimeEndsAtFromForm(endsRaw);
      if (!paid_plan_lifetime_ends_at) {
        return {
          ok: false,
          message: await getUiPhraseForRequest("admin.forms.err_paid_plan_lifetime_ends_at"),
        };
      }
    }

    const limitRawLifetime = readFormString(formData, "paid_plan_lifetime_purchase_limit");
    if (limitRawLifetime) {
      if (!/^\d+$/.test(limitRawLifetime)) {
        return {
          ok: false,
          message: await getUiPhraseForRequest("admin.forms.err_paid_plan_lifetime_purchase_limit"),
        };
      }
      const parsedLimit = Number.parseInt(limitRawLifetime, 10);
      if (parsedLimit < 1 || parsedLimit > 1000000) {
        return {
          ok: false,
          message: await getUiPhraseForRequest("admin.forms.err_paid_plan_lifetime_purchase_limit"),
        };
      }
      paid_plan_lifetime_purchase_limit = parsedLimit;
    }
  }

  const supabase = await createServerSupabaseClient();

  const pro_trial_days = pro_trial_enabled
    ? Number.parseInt(trialDaysRaw, 10)
    : Number.parseInt(
        readFormString(formData, "pro_trial_days") || "14",
        10,
      ) || 14;

  const { error } = await supabase
    .from("system_settings")
    .update({
      system_name,
      support_contact_email: support_contact_email || null,
      default_display_preferences: partial,
      paid_plan_enabled,
      paid_plan_annual_enabled,
      paid_plan_annual_price_eur,
      paid_plan_lifetime_enabled,
      paid_plan_lifetime_price_eur,
      paid_plan_lifetime_ends_at,
      paid_plan_lifetime_purchase_limit,
      paid_plan_price_eur: Math.round(price * 100) / 100,
      paid_plan_free_subscription_limit: limit,
      pro_trial_enabled,
      pro_trial_days: Math.min(365, Math.max(1, pro_trial_days)),
    })
    .eq("id", 1);

  if (error) {
    let msg = error.message;
    if (/paid_plan_lifetime/i.test(msg) && /column/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/156_paid_plan_lifetime.sql` vēl nav palaista (trēkst kolonnas).";
    } else if (/paid_plan_annual_price/i.test(msg) && /column/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/103_paid_plan_annual_price.sql` vēl nav palaista (trēkst kolonnas).";
    } else if (/paid_plan_annual/i.test(msg) && /column/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/101_paid_plan_annual.sql` vēl nav palaista (trēkst kolonnas).";
    } else if (/pro_trial/i.test(msg) && /column/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/107_pro_trial.sql` vēl nav palaista (trēkst kolonnas).";
    } else if (/paid_plan/i.test(msg) && /column/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/027_paid_plan.sql` vēl nav palaista (trēkst kolonnas).";
    } else if (/support_contact_email/i.test(msg) && /column/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/149_system_settings_support_contact_email.sql` vēl nav palaista.";
    } else if (/relation .* does not exist/i.test(msg) || /schema cache/i.test(msg)) {
      msg = "Migrācija `database/supabase/012_system_settings.sql` vēl nav palaista.";
    }
    return { ok: false, message: msg };
  }

  await afterSystemSettingsMutation();
  return { ok: true };
}

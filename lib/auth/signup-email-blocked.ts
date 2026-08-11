import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";

/** Vai ar šo e-pastu nedrīkst reģistrēties (aktīvs konts vai retired pēc dzēšanas). */
export async function isSignupEmailBlocked(
  email: string,
): Promise<boolean | null> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@") || trimmed.length < 5) {
    return false;
  }

  const svc = createServiceRoleSupabaseClient();
  if (!svc) return null;

  const { data, error } = await svc.rpc("signup_email_exists", {
    p_email: trimmed,
  });

  if (error) return null;
  return Boolean(data);
}

export const SIGNUP_EMAIL_TAKEN_MESSAGE = "Šāds e-pasts jau ir sistēmā.";

/** Ģeneriska reģistrācijas kļūda (bez e-pasta enumerācijas). */
export const SIGNUP_GENERIC_ERROR =
  "Neizdevās reģistrēties. Mēģini vēlreiz vai ieej ar esošo kontu.";

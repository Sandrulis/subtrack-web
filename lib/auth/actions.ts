"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { allowServerActionRateLimit } from "@/lib/security/server-action-rate-limit";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";

/** Signup e-pasta pārbaude: max pieprasījumi uz IP minūtē (M2 enumerācijas mazināšana). */
const SIGNUP_EMAIL_EXISTS_MAX_PER_MIN = 24;

/**
 * Klienta formai: vai šis e-pasts jau ir auth.users.
 * Pēc migrācijas `023_security_advisor_rpcs.sql` RPC ir tikai `service_role` –
 * iestatiet `SUPABASE_SERVICE_ROLE_KEY` serverī (.env.local).
 */
export type SignupEmailExistsResult = {
  exists: boolean;
  /** true = pārāk daudz pieprasījumu vai servera kļūda; neinterpretēt kā „e-pasts brīvs”. */
  unavailable?: boolean;
};

export async function signupEmailExistsAction(
  email: string,
): Promise<SignupEmailExistsResult> {
  if (!getSupabasePublicConfig()) {
    return { exists: false };
  }

  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@") || trimmed.length < 5) {
    return { exists: false };
  }

  const allowed = await allowServerActionRateLimit(
    "signup-email-exists",
    SIGNUP_EMAIL_EXISTS_MAX_PER_MIN,
    60_000,
  );
  if (!allowed) {
    return { exists: false, unavailable: true };
  }

  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    return { exists: false, unavailable: true };
  }
  const supabase = svc;

  const { data, error } = await supabase.rpc("signup_email_exists", {
    p_email: trimmed,
  });

  if (error) {
    return { exists: false, unavailable: true };
  }

  return { exists: Boolean(data) };
}

function errParam(msg: string) {
  return encodeURIComponent(msg);
}

export async function signInWithPasswordAction(formData: FormData) {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    redirect(
      "/login?error=" +
        errParam("Supabase nav konfigurēts. Pievieno .env.local ar URL un anon atslēgu."),
    );
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "").trim();
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard";

  if (!email || !password) {
    redirect("/login?error=" + errParam("Aizpildiet e-pastu un paroli."));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=" + errParam(error.message));
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    redirect(
      "/signup?error=" +
        errParam("Supabase nav konfigurēts. Pievieno .env.local ar URL un anon atslēgu."),
    );
  }

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password_confirm") ?? "");

  if (!firstName || !lastName) {
    redirect("/signup?error=" + errParam("Aizpildiet vārdu un uzvārdu."));
  }
  if (!email || !password) {
    redirect("/signup?error=" + errParam("Aizpildiet e-pastu un paroli."));
  }
  if (password.length < 8) {
    redirect("/signup?error=" + errParam("Parolei jābūt vismaz 8 rakstzīmēm."));
  }
  if (password !== password2) {
    redirect("/signup?error=" + errParam("Paroles nesakrīt."));
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${site}/auth/callback?next=/dashboard`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    redirect("/signup?error=" + errParam(error.message));
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/dashboard");
  }

  redirect(
    "/login?message=" +
      errParam(
        "Konts izveidots. Ja ir ieslēgta e-pasta apstiprināšana, pārbaudi pastkasti.",
      ),
  );
}

export type ForgotPasswordFormState = {
  ok: boolean;
  error?: string;
};

export async function requestPasswordResetAction(
  _prev: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    return {
      ok: false,
      error:
        "Supabase nav konfigurēts. Pievieno .env.local ar URL un anon atslēgu.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { ok: false, error: "Ievadiet e-pastu." };
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=${encodeURIComponent("/change-password")}`,
  });

  return { ok: true };
}

export async function signOutAction() {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    redirect("/");
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function changePasswordAction(formData: FormData) {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    redirect(
      "/change-password?error=" +
        errParam("Supabase nav konfigurēts. Pievieno .env.local ar URL un anon atslēgu."),
    );
  }

  const current = String(formData.get("pwd_current") ?? "");
  const newPw = String(formData.get("pwd_new") ?? "");
  const newPw2 = String(formData.get("pwd_new2") ?? "");

  if (!current) {
    redirect(
      "/change-password?error=" + errParam("Ievadiet pašreizējo paroli."),
    );
  }
  if (!newPw || !newPw2) {
    redirect(
      "/change-password?error=" +
        errParam("Aizpildiet jauno paroli un atkārtojumu."),
    );
  }
  if (newPw.length < 8) {
    redirect(
      "/change-password?error=" +
        errParam("Jaunajai parolei jābūt vismaz 8 rakstzīmēm."),
    );
  }
  if (newPw !== newPw2) {
    redirect("/change-password?error=" + errParam("Jaunās paroles nesakrīt."));
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/change-password?error=" + errParam("Nav aktīvas sesijas."));
  }

  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });

  if (verifyErr) {
    redirect(
      "/change-password?error=" + errParam("Pašreizējā parole nav pareiza."),
    );
  }

  const { error: updErr } = await supabase.auth.updateUser({
    password: newPw,
  });

  if (updErr) {
    redirect("/change-password?error=" + errParam(updErr.message));
  }

  revalidatePath("/", "layout");
  redirect("/change-password?message=" + errParam("Parole veiksmīgi nomainīta."));
}

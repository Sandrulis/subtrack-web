"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import {
  registerUserWithLocalizedConfirmEmail,
  sendPasswordResetWithLocalizedEmail,
} from "@/lib/auth/auth-localized-email";
import {
  canSendAuthEmailsViaResend,
  isAuthEmailResendMisconfigured,
} from "@/lib/emails/send-transactional";
import {
  getUiPhraseForRequest,
  resolveRequestUiLocales,
} from "@/lib/ui/server-ui-phrases";
import { isSignupEmailBlocked } from "@/lib/auth/signup-email-blocked";
import { buildRegistrationGeoPayload } from "@/lib/auth/registration-country-payload";
import { getPublicSignupEnabled } from "@/lib/auth/signup-enabled";
import { guestEntryPath } from "@/lib/capacitor/brand-home-href";

/**
 * Klienta formai: vēsturiski e-pasta aizņemtības pārbaude.
 * Vienmēr `{ exists: false }` – bez enumerācijas (privātums).
 */
export type SignupEmailExistsResult = {
  exists: boolean;
  /** true = pārāk daudz pieprasījumu vai servera kļūda; neinterpretēt kā „e-pasts brīvs”. */
  unavailable?: boolean;
};

export async function signupEmailExistsAction(
  _email: string,
): Promise<SignupEmailExistsResult> {
  return { exists: false };
}

function errParam(msg: string) {
  return encodeURIComponent(msg);
}

function loginRedirect(params: {
  error?: string;
  email?: string;
  next?: string;
}) {
  const qs = new URLSearchParams();
  if (params.error) qs.set("error", params.error);
  if (params.email) qs.set("email", params.email);
  if (params.next) qs.set("next", params.next);
  const query = qs.toString();
  return query ? `/login?${query}` : "/login";
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
    redirect(
      loginRedirect({
        error: "Aizpildiet e-pastu un paroli.",
        email: email || undefined,
        next,
      }),
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(loginRedirect({ error: error.message, email, next }));
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export type SignupFormState = {
  ok: boolean;
  error?: string;
  /** E-pasts, uz kuru nosūtīts apstiprinājums (veiksmīga reģistrācija). */
  email?: string;
};

export async function signUpAction(
  _prev: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    return {
      ok: false,
      error:
        "Supabase nav konfigurēts. Pievieno .env.local ar URL un anon atslēgu.",
    };
  }

  if (!(await getPublicSignupEnabled())) {
    return { ok: false, error: await getUiPhraseForRequest("auth.signup.disabled") };
  }

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password_confirm") ?? "");

  if (!firstName || !lastName) {
    return { ok: false, error: "Aizpildiet vārdu un uzvārdu." };
  }
  if (!email || !password) {
    return { ok: false, error: "Aizpildiet e-pastu un paroli." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Parolei jābūt vismaz 8 rakstzīmēm." };
  }
  if (password !== password2) {
    return { ok: false, error: "Paroles nesakrīt." };
  }

  const emailBlocked = await isSignupEmailBlocked(email);
  if (emailBlocked === true) {
    /* Tā pati UX kā veiksmīgai reģistrācijai – bez e-pasta enumerācijas. */
    return { ok: true, email };
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const registrationGeo = await buildRegistrationGeoPayload();

  if (canSendAuthEmailsViaResend()) {
    const { locale } = await resolveRequestUiLocales();
    const custom = await registerUserWithLocalizedConfirmEmail({
      email,
      password,
      firstName,
      lastName,
      siteUrl: site,
      locale,
      registrationGeo,
    });

    if (!custom.ok) {
      if (custom.stage === "email") {
        return {
          ok: false,
          error:
            "Konts var būt izveidots, bet apstiprinājuma e-pastu neizdevās nosūtīt. Mēģini vēlreiz vai sazinies ar atbalstu.",
        };
      }
      return { ok: false, error: custom.message };
    }

    revalidatePath("/", "layout");
    return { ok: true, email };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${site}/auth/callback?next=/dashboard`,
      data: {
        first_name: firstName,
        last_name: lastName,
        ...(registrationGeo.registration_country
          ? { registration_country: registrationGeo.registration_country }
          : {}),
        billing_currency: registrationGeo.billing_currency,
        ...(registrationGeo.interface_language_code
          ? { interface_language_code: registrationGeo.interface_language_code }
          : {}),
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/dashboard");
  }

  return { ok: true, email };
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

  if (isAuthEmailResendMisconfigured()) {
    return {
      ok: false,
      error:
        "Pielāgotajiem e-pastiem serverī vajag SUPABASE_SERVICE_ROLE_KEY (.env / Vercel).",
    };
  }

  if (canSendAuthEmailsViaResend()) {
    const { locale } = await resolveRequestUiLocales();
    const custom = await sendPasswordResetWithLocalizedEmail({
      email,
      siteUrl: site,
      locale,
    });
    if (!custom.ok) {
      return { ok: false, error: custom.error };
    }
    return { ok: true };
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=${encodeURIComponent("/change-password")}`,
  });

  return { ok: true };
}

export async function signOutAction(formData: FormData) {
  const isNative = formData.get("native_app") === "1";
  const afterSignOut = guestEntryPath(isNative);
  const redirectPath = isNative ? `${afterSignOut}?native_shell=1` : afterSignOut;

  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    redirect(redirectPath);
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(redirectPath);
}

export async function changePasswordAction(formData: FormData) {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    redirect(
      "/change-password?error=" +
        errParam("Supabase nav konfigurēts. Pievieno .env.local ar URL un anon atslēgu."),
    );
  }

  const isRecovery = String(formData.get("recovery") ?? "") === "1";
  const recoveryQs = isRecovery ? "recovery=1&" : "";

  const current = String(formData.get("pwd_current") ?? "");
  const newPw = String(formData.get("pwd_new") ?? "");
  const newPw2 = String(formData.get("pwd_new2") ?? "");

  if (!isRecovery && !current) {
    redirect("/settings?error=" + errParam("Ievadiet pašreizējo paroli."));
  }
  if (!newPw || !newPw2) {
    redirect(
      `/change-password?${recoveryQs}error=` +
        errParam("Aizpildiet jauno paroli un atkārtojumu."),
    );
  }
  if (newPw.length < 8) {
    redirect(
      `/change-password?${recoveryQs}error=` +
        errParam("Jaunajai parolei jābūt vismaz 8 rakstzīmēm."),
    );
  }
  if (newPw !== newPw2) {
    redirect(
      `/change-password?${recoveryQs}error=` + errParam("Jaunās paroles nesakrīt."),
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(
      `/change-password?${recoveryQs}error=` + errParam("Nav aktīvas sesijas."),
    );
  }

  if (!isRecovery) {
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (verifyErr) {
      redirect("/settings?error=" + errParam("Pašreizējā parole nav pareiza."));
    }
  }

  const { error: updErr } = await supabase.auth.updateUser({
    password: newPw,
  });

  if (updErr) {
    redirect(
      `/change-password?${recoveryQs}error=` + errParam(updErr.message),
    );
  }

  revalidatePath("/", "layout");

  if (isRecovery) {
    await supabase.auth.signOut();
    redirect(
      "/login?message=" +
        errParam("Parole atjaunota. Tagad vari pieteikties ar jauno paroli."),
    );
  }

  redirect("/settings?message=" + errParam("Parole veiksmīgi nomainīta."));
}

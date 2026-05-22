import { loadEmailTemplatesStoreForSend } from "@/lib/emails/load-email-templates-store";
import {
  canSendAuthEmailsViaResend,
  sendConfirmSignupEmail,
  sendResetPasswordEmail,
} from "@/lib/emails/send-transactional";
import { normalizeEmailLocale } from "@/lib/emails/template-types";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { buildAuthCallbackActionUrl } from "@/lib/auth/auth-callback-link";
import {
  isSignupEmailBlocked,
  SIGNUP_EMAIL_TAKEN_MESSAGE,
} from "@/lib/auth/signup-email-blocked";

export type AuthLocalizedEmailResult =
  | { ok: true }
  | { ok: false; stage: "setup" | "auth" | "email"; message: string };

function mapSignupAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return SIGNUP_EMAIL_TAKEN_MESSAGE;
  }
  if (m.includes("password")) {
    return message;
  }
  return message;
}

function isRecoveryUserMissing(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("not found") ||
    m.includes("no user") ||
    m.includes("user not found") ||
    m.includes("does not exist")
  );
}

/**
 * Izveido lietotāju (admin generateLink) un sūta apstiprinājumu ar `/admin/email-design`
 * `confirm_signup` tekstu aktīvajā UI valodā (Resend API).
 */
export async function registerUserWithLocalizedConfirmEmail(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  siteUrl: string;
  locale: string;
}): Promise<AuthLocalizedEmailResult> {
  if (!canSendAuthEmailsViaResend()) {
    return {
      ok: false,
      stage: "setup",
      message: "RESEND_API_KEY, EMAIL_FROM vai SUPABASE_SERVICE_ROLE_KEY nav iestatīts.",
    };
  }

  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    return {
      ok: false,
      stage: "setup",
      message: "SUPABASE_SERVICE_ROLE_KEY nav iestatīts.",
    };
  }

  const site = input.siteUrl.replace(/\/$/, "");
  const redirectTo = `${site}/auth/callback?next=/dashboard`;
  const email = input.email.trim();
  const emailLocale = normalizeEmailLocale(input.locale);

  const blocked = await isSignupEmailBlocked(email);
  if (blocked === true) {
    return { ok: false, stage: "auth", message: SIGNUP_EMAIL_TAKEN_MESSAGE };
  }
  if (blocked === null) {
    return {
      ok: false,
      stage: "setup",
      message: "E-pasta pārbaude nav pieejama. Mēģini vēlreiz.",
    };
  }

  const { data: linkData, error: linkErr } = await svc.auth.admin.generateLink({
    type: "signup",
    email,
    password: input.password,
    options: {
      redirectTo,
      data: {
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
      },
    },
  });

  if (linkErr) {
    return {
      ok: false,
      stage: "auth",
      message: mapSignupAuthError(linkErr.message),
    };
  }

  const props = linkData?.properties;
  const actionUrl = buildAuthCallbackActionUrl(
    site,
    {
      hashed_token: props?.hashed_token ?? null,
      action_link: props?.action_link ?? null,
    },
    "signup",
    "/dashboard",
  );

  const loaded = await loadEmailTemplatesStoreForSend();
  if (!loaded) {
    return {
      ok: false,
      stage: "setup",
      message: "Neizdevās ielādēt e-pasta šablonus.",
    };
  }

  const sendResult = await sendConfirmSignupEmail({
    to: email,
    locale: emailLocale,
    actionUrl,
    systemName: loaded.systemName,
    siteUrl: site,
    templatesStore: loaded.store,
  });

  if (!sendResult.ok) {
    return {
      ok: false,
      stage: "email",
      message: sendResult.message,
    };
  }

  return { ok: true };
}

/**
 * Paroles atjaunošana: `reset_password` no `/admin/email-design`, UI valoda.
 * Ja lietotājs nav atrasts vai sūtīšana neizdodas, atgriež `ok: true` (bez enumerācijas).
 */
export async function sendPasswordResetWithLocalizedEmail(input: {
  email: string;
  siteUrl: string;
  locale: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canSendAuthEmailsViaResend()) {
    return {
      ok: false,
      error: "RESEND_API_KEY, EMAIL_FROM vai SUPABASE_SERVICE_ROLE_KEY nav iestatīts.",
    };
  }

  const svc = createServiceRoleSupabaseClient();
  if (!svc) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY nav iestatīts." };
  }

  const site = input.siteUrl.replace(/\/$/, "");
  const nextPath = "/change-password";
  const redirectTo = `${site}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  const email = input.email.trim();
  const emailLocale = normalizeEmailLocale(input.locale);

  const { data: linkData, error: linkErr } = await svc.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (linkErr) {
    if (isRecoveryUserMissing(linkErr.message)) {
      return { ok: true };
    }
    return { ok: true };
  }

  const props = linkData?.properties;
  const actionUrl = buildAuthCallbackActionUrl(
    site,
    {
      hashed_token: props?.hashed_token ?? null,
      action_link: props?.action_link ?? null,
    },
    "recovery",
    nextPath,
  );

  const loaded = await loadEmailTemplatesStoreForSend();
  if (!loaded) {
    return { ok: false, error: "Neizdevās ielādēt e-pasta šablonus." };
  }

  const sendResult = await sendResetPasswordEmail({
    to: email,
    locale: emailLocale,
    actionUrl,
    systemName: loaded.systemName,
    siteUrl: site,
    templatesStore: loaded.store,
  });

  if (!sendResult.ok) {
    return {
      ok: false,
      error:
        sendResult.message ||
        "Neizdevās nosūtīt paroles atjaunošanas e-pastu. Pārbaudi RESEND_API_KEY un EMAIL_FROM.",
    };
  }

  return { ok: true };
}

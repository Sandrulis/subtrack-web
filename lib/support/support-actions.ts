"use server";

import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { sendSupportRequestEmail } from "@/lib/support/send-support-email";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";

export type SubmitSupportRequestResult =
  | { ok: true }
  | { ok: false; message: string };

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 4000;

function isValidEmail(email: string): boolean {
  const t = email.trim();
  if (t.length < 3 || t.length > 254) return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t);
}

export async function submitSupportRequestAction(
  formData: FormData,
): Promise<SubmitSupportRequestResult> {
  const { supabase, user, authError } = await loadAuthContext();
  if (authError || !user?.email) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("support.err_unauthorized"),
    };
  }

  const message = String(formData.get("message") ?? "").trim();
  if (message.length < MESSAGE_MIN) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("support.err_message_too_short"),
    };
  }
  if (message.length > MESSAGE_MAX) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("support.err_message_too_long"),
    };
  }

  const { data: settings, error: settingsErr } = await supabase
    .from("system_settings")
    .select("system_name, support_contact_email")
    .eq("id", 1)
    .maybeSingle();

  if (settingsErr) {
    return { ok: false, message: settingsErr.message };
  }

  const supportTo =
    typeof settings?.support_contact_email === "string"
      ? settings.support_contact_email.trim()
      : "";
  if (!supportTo || !isValidEmail(supportTo)) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("support.err_not_configured"),
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, surname")
    .eq("id", user.id)
    .maybeSingle();

  const name = typeof profile?.name === "string" ? profile.name.trim() : "";
  const surname = typeof profile?.surname === "string" ? profile.surname.trim() : "";
  const displayName = [name, surname].filter(Boolean).join(" ") || user.email;

  const systemName =
    typeof settings?.system_name === "string" && settings.system_name.trim()
      ? settings.system_name.trim()
      : DEFAULT_SYSTEM_NAME;

  const sendResult = await sendSupportRequestEmail({
    to: supportTo,
    replyTo: user.email,
    systemName,
    userEmail: user.email,
    userDisplayName: displayName,
    userId: user.id,
    message,
  });

  if (!sendResult.ok) {
    if (sendResult.reason === "not_configured") {
      return {
        ok: false,
        message: await getUiPhraseForRequest("support.err_email_provider"),
      };
    }
    return { ok: false, message: sendResult.message };
  }

  return { ok: true };
}

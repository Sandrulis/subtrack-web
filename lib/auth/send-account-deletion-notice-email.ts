import { getBillingSiteUrl } from "@/lib/billing/stripe-env";
import { resolveEmailCopy } from "@/lib/emails/merge-template-copy";
import { loadEmailTemplatesStoreForSend } from "@/lib/emails/load-email-templates-store";
import { renderEmailHtml } from "@/lib/emails/render-email-html";
import {
  isTransactionalEmailConfigured,
  sendRawTransactionalEmail,
  type SendEmailResult,
} from "@/lib/emails/send-transactional";
import { normalizeEmailLocale } from "@/lib/emails/template-types";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";

const TEMPLATE_ID = "account_deletion_notice" as const;

function isValidEmail(email: string): boolean {
  const t = email.trim();
  if (t.length < 3 || t.length > 254) return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t);
}

/**
 * Paziņojums uz `system_settings.support_contact_email`, ja lietotājs norādījis iemeslu.
 */
export async function sendAccountDeletionNoticeEmail(input: {
  supportTo: string;
  replyTo: string;
  systemName: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  deletionReason: string;
  locale: string;
  templatesStore?: Awaited<ReturnType<typeof loadEmailTemplatesStoreForSend>>;
}): Promise<SendEmailResult> {
  if (!isTransactionalEmailConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message: "RESEND_API_KEY vai EMAIL_FROM nav iestatīts.",
    };
  }

  const reason = input.deletionReason.trim();
  if (!reason) {
    return { ok: true };
  }

  const tplBundle =
    input.templatesStore ?? (await loadEmailTemplatesStoreForSend());
  if (!tplBundle) {
    return {
      ok: false,
      reason: "not_configured",
      message: "E-pasta šabloni nav pieejami.",
    };
  }

  const loc = normalizeEmailLocale(input.locale);
  const systemName = input.systemName.trim() || tplBundle.systemName || DEFAULT_SYSTEM_NAME;
  const copy = resolveEmailCopy(
    TEMPLATE_ID,
    loc,
    tplBundle.store,
    systemName,
    undefined,
    undefined,
    undefined,
    undefined,
    {
      userEmail: input.userEmail.trim(),
      userDisplayName: input.userDisplayName.trim() || input.userEmail.trim(),
      userId: input.userId.trim(),
      deletionReason: reason,
    },
  );

  const siteUrl = getBillingSiteUrl();
  const html = renderEmailHtml(copy, {
    systemName,
    siteUrl,
    actionUrl: `${siteUrl.replace(/\/$/, "")}/admin/users`,
    accent: "warning",
  });

  return sendRawTransactionalEmail({
    to: input.supportTo.trim(),
    replyTo: input.replyTo.trim(),
    subject: copy.subject,
    html,
  });
}

export async function loadSupportContactEmailForDeletionNotice(): Promise<{
  supportTo: string;
  systemName: string;
} | null> {
  const service = createServiceRoleSupabaseClient();
  if (!service) return null;

  const { data, error } = await service
    .from("system_settings")
    .select("system_name, support_contact_email")
    .eq("id", 1)
    .maybeSingle();

  if (error) return null;

  const supportTo =
    typeof data?.support_contact_email === "string"
      ? data.support_contact_email.trim()
      : "";
  if (!supportTo || !isValidEmail(supportTo)) return null;

  const systemName =
    typeof data?.system_name === "string" && data.system_name.trim()
      ? data.system_name.trim()
      : DEFAULT_SYSTEM_NAME;

  return { supportTo, systemName };
}

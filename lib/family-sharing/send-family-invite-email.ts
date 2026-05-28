import { loadEmailTemplatesStoreForSend } from "@/lib/emails/load-email-templates-store";
import {
  isTransactionalEmailConfigured,
  sendAuthTemplateEmail,
  type SendEmailResult,
} from "@/lib/emails/send-transactional";
import { normalizeEmailLocale } from "@/lib/emails/template-types";
import { normalizeInviteEmail } from "@/lib/family-sharing/family-sharing-server";
import { getPublicSiteUrl } from "@/lib/site-url";

/** Reģistrācijas saite ģimenes uzaicinājuma e-pastā (`invite_user` šablons). */
export function buildFamilySharingSignupInviteUrl(inviteEmail: string): string {
  const site = getPublicSiteUrl();
  const email = normalizeInviteEmail(inviteEmail);
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  const q = params.toString();
  return q ? `${site}/signup?${q}` : `${site}/signup`;
}

/**
 * Uzaicinājums uz e-pastu, ja adresāts vēl nav `public.users`
 * (admin `/admin/email-design` → „Uzaicinājums” / `invite_user`).
 */
export async function sendFamilySharingInviteUserEmail(input: {
  to: string;
  locale: string;
}): Promise<SendEmailResult> {
  if (!isTransactionalEmailConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message: "RESEND_API_KEY vai EMAIL_FROM nav iestatīts.",
    };
  }

  const loaded = await loadEmailTemplatesStoreForSend();
  if (!loaded) {
    return {
      ok: false,
      reason: "provider_error",
      message: "Neizdevās ielādēt e-pasta šablonus.",
    };
  }

  const siteUrl = getPublicSiteUrl();
  const actionUrl = buildFamilySharingSignupInviteUrl(input.to);

  return sendAuthTemplateEmail({
    templateId: "invite_user",
    to: input.to,
    locale: normalizeEmailLocale(input.locale),
    actionUrl,
    systemName: loaded.systemName,
    siteUrl,
    templatesStore: loaded.store,
  });
}

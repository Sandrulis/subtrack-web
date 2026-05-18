import { renderEmailHtml } from "./render-email-html";
import type { EmailRenderContext, EmailTemplateCopy, EmailTemplateId } from "./template-types";
import { SUPABASE_AUTH_TEMPLATE_MAP } from "./template-types";

const SUPABASE_CTA_URL: Record<EmailTemplateId, string> = {
  confirm_signup: "{{ .ConfirmationURL }}",
  reset_password: "{{ .ConfirmationURL }}",
  magic_link: "{{ .ConfirmationURL }}",
  email_change: "{{ .ConfirmationURL }}",
  invite_user: "{{ .ConfirmationURL }}",
  reauthentication: "{{ .ConfirmationURL }}",
  overdue_payment: "{{ .SiteURL }}/dashboard",
};

/** Supabase Auth šabloniem: teksts ar Go mainīgajiem (bez pilna HTML wrapper, ja vēlies vienkāršāku) */
export function exportSupabaseAuthBodyHtml(
  copy: EmailTemplateCopy,
  templateId: EmailTemplateId,
  systemName: string,
): string {
  const ctx: EmailRenderContext = {
    systemName,
    siteUrl: "{{ .SiteURL }}",
    actionUrl: SUPABASE_CTA_URL[templateId] ?? "{{ .ConfirmationURL }}",
    accent: "primary",
  };
  return renderEmailHtml(copy, ctx);
}

export function getSupabaseDashboardTemplateName(
  templateId: EmailTemplateId,
): string | null {
  const key = SUPABASE_AUTH_TEMPLATE_MAP[templateId];
  if (!key) return null;
  const labels: Record<string, string> = {
    confirmation: "Confirm signup",
    recovery: "Reset password",
    magic_link: "Magic Link",
    email_change: "Change email address",
    invite: "Invite user",
    reauthentication: "Reauthentication",
  };
  return labels[key] ?? key;
}

export function buildSupabasePasteBundle(
  copy: EmailTemplateCopy,
  templateId: EmailTemplateId,
  systemName: string,
): string {
  const dashName = getSupabaseDashboardTemplateName(templateId);
  const html = exportSupabaseAuthBodyHtml(copy, templateId, systemName);
  return [
    `Supabase → Authentication → Email Templates → ${dashName ?? templateId}`,
    "",
    `Subject: ${copy.subject}`,
    "",
    "Body (HTML):",
    html,
    "",
    "Piezīme: poga izmanto {{ .ConfirmationURL }}. Pēc custom SMTP var noņemt Supabase kājeni.",
  ].join("\n");
}

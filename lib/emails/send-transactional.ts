import { resolveEmailCopy } from "./merge-template-copy";
import { renderEmailHtml } from "./render-email-html";
import type { EmailTemplateId, EmailTemplatesStore } from "./template-types";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { buildPreviewRenderContext } from "./preview-context";
import {
  formatAmountForEmail,
  formatDueDateForEmail,
  type OverdueSubscriptionRow,
} from "@/lib/subscriptions/overdue-for-email";

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; reason: "not_configured" | "provider_error"; message: string };

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const cfg = getResendConfig();
  if (!cfg) {
    return {
      ok: false,
      reason: "not_configured",
      message: "RESEND_API_KEY vai EMAIL_FROM nav iestatīts.",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: cfg.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      reason: "provider_error",
      message: text.slice(0, 500) || `Resend HTTP ${res.status}`,
    };
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, id: data.id };
}

export async function sendAuthTemplateEmail(input: {
  templateId: EmailTemplateId;
  to: string;
  locale: string;
  actionUrl: string;
  systemName: string;
  siteUrl: string;
  templatesStore: EmailTemplatesStore;
}): Promise<SendEmailResult> {
  const { templateId, to, locale, actionUrl, systemName, siteUrl, templatesStore } =
    input;

  const copy = resolveEmailCopy(templateId, locale, templatesStore, systemName);
  const ctx = buildPreviewRenderContext(templateId, systemName, siteUrl);
  ctx.actionUrl = actionUrl;

  const html = renderEmailHtml(copy, ctx);
  return sendViaResend({ to, subject: copy.subject, html });
}

export async function sendConfirmSignupEmail(input: {
  to: string;
  locale: string;
  actionUrl: string;
  systemName: string;
  siteUrl: string;
  templatesStore: EmailTemplatesStore;
}): Promise<SendEmailResult> {
  return sendAuthTemplateEmail({
    templateId: "confirm_signup",
    ...input,
  });
}

/** Auth e-pasti (reģistrācija, aizmirstā parole) caur Resend + admin šabloni. */
export function canSendAuthEmailsViaResend(): boolean {
  return (
    isTransactionalEmailConfigured() &&
    !!getSupabasePublicConfig() &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

/** @deprecated use canSendAuthEmailsViaResend */
export const canSendSignupConfirmViaResend = canSendAuthEmailsViaResend;

export async function sendResetPasswordEmail(input: {
  to: string;
  locale: string;
  actionUrl: string;
  systemName: string;
  siteUrl: string;
  templatesStore: EmailTemplatesStore;
}): Promise<SendEmailResult> {
  return sendAuthTemplateEmail({
    templateId: "reset_password",
    ...input,
  });
}

export async function sendOverduePaymentEmail(input: {
  row: OverdueSubscriptionRow;
  systemName: string;
  siteUrl: string;
  templatesStore: EmailTemplatesStore;
}): Promise<SendEmailResult> {
  const { row, systemName, siteUrl, templatesStore } = input;
  const amountFormatted = formatAmountForEmail(row.amount, row.currency, row.locale);
  const dueDateFormatted = formatDueDateForEmail(row.nextPaymentDate, row.locale);

  const copy = resolveEmailCopy(
    "overdue_payment",
    row.locale,
    templatesStore,
    systemName,
    {
      paymentName: row.paymentName,
      amountFormatted,
      dueDateFormatted,
      overdueDays: row.overdueDays,
    },
  );

  const ctx = buildPreviewRenderContext("overdue_payment", systemName, siteUrl);
  ctx.paymentName = row.paymentName;
  ctx.amountFormatted = amountFormatted;
  ctx.dueDateFormatted = dueDateFormatted;
  ctx.overdueDays = row.overdueDays;

  const html = renderEmailHtml(copy, ctx);
  return sendViaResend({ to: row.email, subject: copy.subject, html });
}

export function isTransactionalEmailConfigured(): boolean {
  return getResendConfig() !== null;
}

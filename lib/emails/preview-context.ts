import {
  normalizeEmailLocale,
  type EmailPreviewLocale,
  type EmailRenderContext,
  type EmailTemplateId,
} from "./template-types";

const SAMPLE_PAYMENT = {
  paymentName: "Netflix",
  amountFormatted: "€12.99",
  dueDateFormatted: "2026-05-10",
  overdueDays: 8,
};

const PREVIEW_DUE_ISO = "2026-05-10";

const DUE_DATE_BCP47: Record<EmailPreviewLocale, string> = {
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-PT",
  lv: "lv-LV",
  ru: "ru-RU",
};

export function buildPreviewRenderContext(
  templateId: EmailTemplateId,
  systemName: string,
  siteUrl: string,
): EmailRenderContext {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const accent =
    templateId === "overdue_payment"
      ? "danger"
      : templateId === "payment_due_today"
        ? "warning"
        : templateId === "trial_ending"
          ? "warning"
          : templateId === "reset_password"
            ? "warning"
            : "primary";

  const actionUrls: Record<EmailTemplateId, string> = {
    confirm_signup: `${baseUrl}/auth/callback?type=signup&example=1`,
    reset_password: `${baseUrl}/auth/callback?next=/change-password&example=1`,
    magic_link: `${baseUrl}/auth/callback?example=1`,
    email_change: `${baseUrl}/auth/callback?type=email&example=1`,
    invite_user: `${baseUrl}/signup?invite=example`,
    reauthentication: `${baseUrl}/settings?reauth=example`,
    overdue_payment: `${baseUrl}/dashboard`,
    payment_due_today: `${baseUrl}/dashboard`,
    weekly_summary: `${baseUrl}/dashboard`,
    trial_ending: `${baseUrl}/subscribe`,
  };

  return {
    systemName,
    siteUrl: baseUrl,
    actionUrl: actionUrls[templateId],
    accent,
    ...SAMPLE_PAYMENT,
  };
}

export function overduePreviewContext(locale: string) {
  const loc = normalizeEmailLocale(locale);
  const bcp47 = DUE_DATE_BCP47[loc];
  let dueDateFormatted = PREVIEW_DUE_ISO;
  try {
    dueDateFormatted = new Intl.DateTimeFormat(bcp47, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(`${PREVIEW_DUE_ISO}T12:00:00Z`));
  } catch {
    dueDateFormatted = PREVIEW_DUE_ISO;
  }
  return {
    ...SAMPLE_PAYMENT,
    dueDateFormatted,
  };
}

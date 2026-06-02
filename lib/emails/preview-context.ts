import type { DisplayPreferences } from "@/lib/user-display-preferences";
import {
  EMAIL_DESIGN_PREVIEW_ISO,
  formatEmailDesignPreviewDate,
} from "./email-design-preview-dates";
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

const PREVIEW_DUE_ISO = EMAIL_DESIGN_PREVIEW_ISO.dueToday;

export function buildPreviewRenderContext(
  templateId: EmailTemplateId,
  systemName: string,
  siteUrl: string,
): EmailRenderContext {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const accent =
    templateId === "payment_due_today"
      ? "warning"
      : templateId === "trial_ending"
          ? "warning"
          : templateId === "win_back_7d" || templateId === "win_back_30d"
            ? "primary"
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
    payment_due_today: `${baseUrl}/dashboard`,
    weekly_summary: `${baseUrl}/dashboard`,
    trial_ending: `${baseUrl}/subscribe`,
    win_back_7d: `${baseUrl}/dashboard`,
    win_back_30d: `${baseUrl}/dashboard`,
    account_deletion_notice: `${baseUrl}/admin/users`,
  };

  return {
    systemName,
    siteUrl: baseUrl,
    actionUrl: actionUrls[templateId],
    accent,
    ...SAMPLE_PAYMENT,
  };
}

export function overduePreviewContext(
  locale: string,
  systemDefaults?: Partial<DisplayPreferences> | null,
) {
  const loc = normalizeEmailLocale(locale);
  return {
    ...SAMPLE_PAYMENT,
    dueDateFormatted: formatEmailDesignPreviewDate(PREVIEW_DUE_ISO, loc, systemDefaults),
  };
}

export function trialEndingPreviewContext(
  locale: EmailPreviewLocale,
  systemDefaults?: Partial<DisplayPreferences> | null,
) {
  return {
    trialDaysRemaining: 3,
    trialEndDateFormatted: formatEmailDesignPreviewDate(
      EMAIL_DESIGN_PREVIEW_ISO.trialEnd,
      locale,
      systemDefaults,
    ),
  };
}

export function accountDeletionPreviewContext(): {
  userEmail: string;
  userDisplayName: string;
  userId: string;
  deletionReason: string;
} {
  return {
    userEmail: "lietotajs@example.com",
    userDisplayName: "Anna Bērziņa",
    userId: "00000000-0000-4000-8000-000000000001",
    deletionReason:
      "Pārāk daudz manuālas ievades – vēlos vienkāršāku risinājumu citur.",
  };
}

export function winBackPreviewContext(
  templateId: "win_back_7d" | "win_back_30d",
  locale: EmailPreviewLocale,
  systemDefaults?: Partial<DisplayPreferences> | null,
) {
  const inactiveDays = templateId === "win_back_7d" ? 7 : 30;
  const iso =
    templateId === "win_back_7d"
      ? EMAIL_DESIGN_PREVIEW_ISO.winBackLastSeen7d
      : EMAIL_DESIGN_PREVIEW_ISO.winBackLastSeen30d;
  return {
    inactiveDays,
    lastSeenFormatted: formatEmailDesignPreviewDate(iso, locale, systemDefaults),
  };
}

export const EMAIL_TEMPLATE_IDS = [
  "confirm_signup",
  "reset_password",
  "magic_link",
  "email_change",
  "invite_user",
  "reauthentication",
  "payment_due_today",
  "weekly_summary",
  "trial_ending",
  "win_back_7d",
  "win_back_30d",
  "account_deletion_notice",
] as const;

/** Cron / Resend šabloni (nav Supabase Auth). */
export const EMAIL_CRON_TEMPLATE_IDS = [
  "payment_due_today",
  "weekly_summary",
  "trial_ending",
  "win_back_7d",
  "win_back_30d",
] as const;

export type EmailCronTemplateId = (typeof EMAIL_CRON_TEMPLATE_IDS)[number];

export type EmailTemplateId = (typeof EMAIL_TEMPLATE_IDS)[number];

/** Saskaņā ar `public.languages` (007) */
export const EMAIL_SUPPORTED_LOCALES = [
  "en",
  "fr",
  "de",
  "es",
  "pt",
  "lv",
  "ru",
] as const;

export type EmailPreviewLocale = (typeof EMAIL_SUPPORTED_LOCALES)[number];

/** @deprecated use EMAIL_SUPPORTED_LOCALES */
export const EMAIL_PREVIEW_LOCALES = EMAIL_SUPPORTED_LOCALES;

export function normalizeEmailLocale(code: string): EmailPreviewLocale {
  const c = code.trim().toLowerCase().slice(0, 2);
  if ((EMAIL_SUPPORTED_LOCALES as readonly string[]).includes(c)) {
    return c as EmailPreviewLocale;
  }
  return "en";
}

export type EmailTemplateCopy = {
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  ctaLabel: string;
  footerNote: string;
};

export type EmailTemplatesStore = Partial<
  Record<EmailTemplateId, Partial<Record<string, Partial<EmailTemplateCopy>>>>
>;

export type EmailRenderContext = {
  systemName: string;
  siteUrl: string;
  actionUrl: string;
  accent: "primary" | "danger" | "warning";
  /** App e-pasti (kavēts / šodien) */
  paymentName?: string;
  amountFormatted?: string;
  dueDateFormatted?: string;
  overdueDays?: number;
  /** Izmēģinājuma periods */
  trialDaysRemaining?: number;
  trialEndDateFormatted?: string;
  /** Win-back (neaktīvs lietotājs) */
  inactiveDays?: number;
  lastSeenFormatted?: string;
  /** Papildu HTML (nedēļas kopsavilkums) */
  extraSectionsHtml?: string;
  /** Zem kājenes (piem. atteikšanās) */
  secondaryFooterHtml?: string;
};

export type SupabaseAuthTemplateKey =
  | "confirmation"
  | "recovery"
  | "magic_link"
  | "email_change"
  | "invite"
  | "reauthentication";

export const SUPABASE_AUTH_TEMPLATE_MAP: Record<
  EmailTemplateId,
  SupabaseAuthTemplateKey | null
> = {
  confirm_signup: "confirmation",
  reset_password: "recovery",
  magic_link: "magic_link",
  email_change: "email_change",
  invite_user: "invite",
  reauthentication: "reauthentication",
  payment_due_today: null,
  weekly_summary: null,
  trial_ending: null,
  win_back_7d: null,
  win_back_30d: null,
  account_deletion_notice: null,
};

import {
  applyOverduePlaceholders,
  applyPaymentPlaceholders,
  applySystemNameToCopy,
  applyTrialPlaceholders,
  applyWeeklySubjectPlaceholders,
  getDefaultEmailCopy,
} from "./default-templates";
import { ensureSystemNamePlaceholder } from "./system-name-in-copy";
import { normalizeEmailLocale } from "./template-types";
import type {
  EmailTemplateCopy,
  EmailTemplateId,
  EmailTemplatesStore,
} from "./template-types";

/** Apvieno noklusējumu un DB pielāgojumus; **bez** sistēmas nosaukuma aizvietošanas (paliek `{SYSTEM_NAME}`). */
export function mergeEmailTemplateCopy(
  templateId: EmailTemplateId,
  locale: string,
  store: EmailTemplatesStore | null | undefined,
): EmailTemplateCopy {
  const locKey = normalizeEmailLocale(locale);
  const base = getDefaultEmailCopy(templateId, locKey);
  const overlay =
    store?.[templateId]?.[locKey] ?? store?.[templateId]?.[locale.trim().toLowerCase()];
  return {
    subject: overlay?.subject?.trim() || base.subject,
    preheader: overlay?.preheader?.trim() || base.preheader,
    headline: overlay?.headline?.trim() || base.headline,
    body: overlay?.body?.trim() || base.body,
    ctaLabel: overlay?.ctaLabel?.trim() || base.ctaLabel,
    footerNote: overlay?.footerNote?.trim() || base.footerNote,
  };
}

/** Priekšskatījumam un sūtīšanai: `{SYSTEM_NAME}` → `system_settings.system_name`. */
export function resolveEmailCopy(
  templateId: EmailTemplateId,
  locale: string,
  store: EmailTemplatesStore | null | undefined,
  systemName: string,
  overdueCtx?: {
    paymentName: string;
    amountFormatted: string;
    dueDateFormatted: string;
    overdueDays: number;
  },
  weeklyCtx?: { weekRangeLabel: string },
  trialCtx?: { trialDaysRemaining: number; trialEndDateFormatted: string },
): EmailTemplateCopy {
  const merged = mergeEmailTemplateCopy(templateId, locale, store);
  const name = systemName.trim();

  if (templateId === "payment_due_today" && overdueCtx) {
    return applyPaymentPlaceholders(merged, { systemName: name, ...overdueCtx });
  }
  if (templateId === "weekly_summary" && weeklyCtx) {
    return applyWeeklySubjectPlaceholders(merged, {
      systemName: name,
      weekRangeLabel: weeklyCtx.weekRangeLabel,
    });
  }
  if (templateId === "trial_ending" && trialCtx) {
    return applyTrialPlaceholders(merged, { systemName: name, ...trialCtx });
  }
  return applySystemNameToCopy(merged, name);
}

/** Ielādējot no DB: iebakedēts produkta nosaukums → `{SYSTEM_NAME}`. */
export function normalizeStoredEmailTemplates(
  store: EmailTemplatesStore,
  systemName: string,
): EmailTemplatesStore {
  const out: EmailTemplatesStore = {};
  for (const [tid, locales] of Object.entries(store)) {
    if (!locales) continue;
    const locMap: NonNullable<EmailTemplatesStore[EmailTemplateId]> = {};
    for (const [loc, partial] of Object.entries(locales)) {
      if (!partial) continue;
      const next: Partial<EmailTemplateCopy> = {};
      const keys: (keyof EmailTemplateCopy)[] = [
        "subject",
        "preheader",
        "headline",
        "body",
        "ctaLabel",
        "footerNote",
      ];
      for (const key of keys) {
        const v = partial[key];
        if (typeof v === "string" && v.trim()) {
          next[key] = ensureSystemNamePlaceholder(v, systemName);
        }
      }
      if (Object.keys(next).length > 0) {
        locMap[loc] = next;
      }
    }
    if (Object.keys(locMap).length > 0) {
      out[tid as EmailTemplateId] = locMap;
    }
  }
  return out;
}

export function sanitizeEmailTemplatesStore(
  raw: unknown,
): EmailTemplatesStore {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: EmailTemplatesStore = {};
  const obj = raw as Record<string, unknown>;
  for (const [tid, locales] of Object.entries(obj)) {
    if (!locales || typeof locales !== "object" || Array.isArray(locales)) continue;
    const locMap: NonNullable<EmailTemplatesStore[EmailTemplateId]> = {};
    for (const [loc, fields] of Object.entries(locales as Record<string, unknown>)) {
      if (!fields || typeof fields !== "object" || Array.isArray(fields)) continue;
      const f = fields as Record<string, unknown>;
      const pick = (k: keyof EmailTemplateCopy) =>
        typeof f[k] === "string" ? String(f[k]).slice(0, 2000) : undefined;
      const copy: Partial<EmailTemplateCopy> = {};
      const subject = pick("subject");
      const preheader = pick("preheader");
      const headline = pick("headline");
      const body = pick("body");
      const ctaLabel = pick("ctaLabel");
      const footerNote = pick("footerNote");
      if (subject) copy.subject = subject;
      if (preheader) copy.preheader = preheader;
      if (headline) copy.headline = headline;
      if (body) copy.body = body;
      if (ctaLabel) copy.ctaLabel = ctaLabel;
      if (footerNote) copy.footerNote = footerNote;
      const locNorm = loc.trim().toLowerCase();
      if (locNorm.length >= 2 && locNorm.length <= 5 && Object.keys(copy).length > 0) {
        locMap[locNorm] = copy;
      }
    }
    if (Object.keys(locMap).length > 0) {
      out[tid as EmailTemplateId] = locMap;
    }
  }
  return out;
}

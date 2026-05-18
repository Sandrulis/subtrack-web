"use client";

import { saveEmailTemplatesAction } from "@/lib/admin/email-template-actions";
import { getDefaultEmailCopy } from "@/lib/emails/default-templates";
import {
  mergeEmailTemplateCopy,
  resolveEmailCopy,
} from "@/lib/emails/merge-template-copy";
import { ensureSystemNamePlaceholderInCopy } from "@/lib/emails/system-name-in-copy";
import {
  buildPreviewRenderContext,
  overduePreviewContext,
} from "@/lib/emails/preview-context";
import { renderEmailHtml } from "@/lib/emails/render-email-html";
import { buildSupabasePasteBundle } from "@/lib/emails/supabase-export";
import {
  EMAIL_SUPPORTED_LOCALES,
  EMAIL_TEMPLATE_IDS,
  normalizeEmailLocale,
  type EmailPreviewLocale,
  type EmailTemplateCopy,
  type EmailTemplateId,
  type EmailTemplatesStore,
} from "@/lib/emails/template-types";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { useCallback, useEffect, useMemo, useState } from "react";

const TEMPLATE_LABEL_KEYS: Record<
  EmailTemplateId,
  | "admin.email_design.template.confirm_signup"
  | "admin.email_design.template.reset_password"
  | "admin.email_design.template.magic_link"
  | "admin.email_design.template.email_change"
  | "admin.email_design.template.invite_user"
  | "admin.email_design.template.reauthentication"
  | "admin.email_design.template.overdue_payment"
> = {
  confirm_signup: "admin.email_design.template.confirm_signup",
  reset_password: "admin.email_design.template.reset_password",
  magic_link: "admin.email_design.template.magic_link",
  email_change: "admin.email_design.template.email_change",
  invite_user: "admin.email_design.template.invite_user",
  reauthentication: "admin.email_design.template.reauthentication",
  overdue_payment: "admin.email_design.template.overdue_payment",
};

export type EmailDesignLocaleOption = {
  code: string;
  label: string;
};

type AdminEmailDesignPanelProps = {
  initialSystemName: string;
  initialStore: EmailTemplatesStore;
  siteUrl: string;
  loadError: string | null;
  resendConfigured: boolean;
  localeOptions: EmailDesignLocaleOption[];
};

function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

export function AdminEmailDesignPanel({
  initialSystemName,
  initialStore,
  siteUrl,
  loadError,
  resendConfigured,
  localeOptions,
}: AdminEmailDesignPanelProps) {
  const { t } = useSubtrackIntl();
  const locales = useMemo(() => {
    if (localeOptions.length > 0) {
      return localeOptions.map((o) => ({
        code: normalizeEmailLocale(o.code),
        label: o.label.trim() || o.code.toUpperCase(),
      }));
    }
    return EMAIL_SUPPORTED_LOCALES.map((code) => ({
      code,
      label: code.toUpperCase(),
    }));
  }, [localeOptions]);

  const [store, setStore] = useState<EmailTemplatesStore>(() => ({ ...initialStore }));
  const [templateId, setTemplateId] = useState<EmailTemplateId>("confirm_signup");
  const [locale, setLocale] = useState<EmailPreviewLocale>(() => locales[0]?.code ?? "lv");
  const [draft, setDraft] = useState<EmailTemplateCopy>(() =>
    mergeEmailTemplateCopy("confirm_signup", "lv", initialStore),
  );
  const [saving, setSaving] = useState(false);

  const isAuthTemplate = templateId !== "overdue_payment";

  const reloadDraft = useCallback(
    (tid: EmailTemplateId, loc: EmailPreviewLocale, nextStore: EmailTemplatesStore) => {
      setDraft(mergeEmailTemplateCopy(tid, loc, nextStore));
    },
    [],
  );

  useEffect(() => {
    reloadDraft(templateId, locale, store);
  }, [templateId, locale, store, reloadDraft]);

  const storeForPreview = useMemo(
    () => ({
      ...store,
      [templateId]: {
        ...store[templateId],
        [locale]: draft,
      },
    }),
    [store, templateId, locale, draft],
  );

  const previewCopy = useMemo(() => {
    const overdue =
      templateId === "overdue_payment" ? overduePreviewContext(locale) : undefined;
    return resolveEmailCopy(
      templateId,
      locale,
      storeForPreview,
      initialSystemName,
      overdue,
    );
  }, [storeForPreview, templateId, locale, initialSystemName]);

  const previewHtml = useMemo(() => {
    const overdue =
      templateId === "overdue_payment" ? overduePreviewContext(locale) : undefined;
    const ctx = buildPreviewRenderContext(templateId, initialSystemName, siteUrl);
    if (overdue) {
      ctx.paymentName = overdue.paymentName;
      ctx.amountFormatted = overdue.amountFormatted;
      ctx.dueDateFormatted = overdue.dueDateFormatted;
      ctx.overdueDays = overdue.overdueDays;
    }
    return renderEmailHtml(previewCopy, ctx);
  }, [previewCopy, templateId, initialSystemName, siteUrl, locale]);

  const resolvedForExport = previewCopy;

  function patchDraft(patch: Partial<EmailTemplateCopy>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function draftForStorage(copy: EmailTemplateCopy): EmailTemplateCopy {
    return ensureSystemNamePlaceholderInCopy(copy, initialSystemName);
  }

  function commitDraftToStore() {
    const stored = draftForStorage(draft);
    setStore((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [locale]: stored,
      },
    }));
  }

  function handleFieldBlur() {
    commitDraftToStore();
  }

  async function handleSave() {
    const stored = draftForStorage(draft);
    const nextStore: EmailTemplatesStore = {
      ...store,
      [templateId]: {
        ...store[templateId],
        [locale]: stored,
      },
    };
    setStore(nextStore);
    const payload = JSON.stringify(nextStore);
    setSaving(true);
    const res = await saveEmailTemplatesAction(payload);
    setSaving(false);
    if (res.ok) {
      pushDomToast(t("admin.email_design.toast_saved"), "success");
    } else {
      pushDomToast(res.message, "error");
    }
  }

  function handleResetLocale() {
    const base = getDefaultEmailCopy(templateId, locale);
    setDraft({ ...base });
    setStore((prev) => {
      const next = { ...prev };
      const locs = { ...next[templateId] };
      delete locs[locale];
      if (Object.keys(locs).length === 0) {
        delete next[templateId];
      } else {
        next[templateId] = locs;
      }
      return next;
    });
    pushDomToast(t("admin.email_design.toast_reset_locale"), "success");
  }

  async function handleCopyHtml() {
    const ok = await copyToClipboard(previewHtml);
    pushDomToast(
      ok ? t("admin.email_design.toast_copied_html") : t("admin.email_design.toast_copy_failed"),
      ok ? "success" : "error",
    );
  }

  async function handleCopySupabase() {
    if (!isAuthTemplate) {
      pushDomToast(t("admin.email_design.toast_supabase_auth_only"), "error");
      return;
    }
    const bundle = buildSupabasePasteBundle(
      resolvedForExport,
      templateId,
      initialSystemName,
    );
    const ok = await copyToClipboard(bundle);
    pushDomToast(
      ok ? t("admin.email_design.toast_copied_supabase") : t("admin.email_design.toast_copy_failed"),
      ok ? "success" : "error",
    );
  }

  return (
    <div className="admin-email-design">
      {loadError ? (
        <p className="admin-alert admin-alert--error" role="alert">
          {loadError}
        </p>
      ) : null}

      {!resendConfigured ? (
        <p className="admin-alert admin-alert--warning admin-email-design-env-hint" role="status">
          {t("admin.email_design.resend_hint")}
        </p>
      ) : null}

      <div className="admin-email-design-toolbar">
        <div className="admin-email-design-templates" role="tablist" aria-label={t("admin.email_design.templates_aria")}>
          {EMAIL_TEMPLATE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={templateId === id}
              className={
                "admin-email-design-tab" + (templateId === id ? " is-active" : "")
              }
              onClick={() => setTemplateId(id)}
            >
              {t(TEMPLATE_LABEL_KEYS[id])}
            </button>
          ))}
        </div>
        <div className="admin-email-design-locales" role="group" aria-label={t("admin.email_design.locale_aria")}>
          {locales.map((loc) => (
            <button
              key={loc.code}
              type="button"
              className={
                "admin-email-design-locale" + (locale === loc.code ? " is-active" : "")
              }
              aria-pressed={locale === loc.code}
              title={loc.label}
              onClick={() => setLocale(loc.code)}
            >
              {loc.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-email-design-grid">
        <section className="admin-email-design-editor card">
          <h2 className="admin-email-design-section-title">
            {t("admin.email_design.editor_heading")}
          </h2>
          <p className="admin-email-design-hint">
            {isAuthTemplate
              ? t("admin.email_design.editor_hint_auth")
              : t("admin.email_design.editor_hint_overdue")}
          </p>

          <div className="form-group">
            <label htmlFor="email-subject">{t("admin.email_design.field.subject")}</label>
            <input
              id="email-subject"
              type="text"
              value={draft.subject}
              onChange={(e) => patchDraft({ subject: e.target.value })}
              onBlur={handleFieldBlur}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email-preheader">{t("admin.email_design.field.preheader")}</label>
            <input
              id="email-preheader"
              type="text"
              value={draft.preheader}
              onChange={(e) => patchDraft({ preheader: e.target.value })}
              onBlur={handleFieldBlur}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email-headline">{t("admin.email_design.field.headline")}</label>
            <input
              id="email-headline"
              type="text"
              value={draft.headline}
              onChange={(e) => patchDraft({ headline: e.target.value })}
              onBlur={handleFieldBlur}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email-body">{t("admin.email_design.field.body")}</label>
            <textarea
              id="email-body"
              rows={5}
              value={draft.body}
              onChange={(e) => patchDraft({ body: e.target.value })}
              onBlur={handleFieldBlur}
            />
            {templateId === "overdue_payment" ? (
              <p className="form-hint">
                {t("admin.email_design.placeholders_overdue")}
              </p>
            ) : (
              <p className="form-hint">
                {t("admin.email_design.placeholders_system")}{" "}
                <span className="admin-inline-code">{`{SYSTEM_NAME}`}</span>
                {" → "}
                <strong>{initialSystemName}</strong>
                {" "}
                (<a href="/admin/system">{t("admin.nav.system")}</a>)
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="email-cta">{t("admin.email_design.field.cta")}</label>
            <input
              id="email-cta"
              type="text"
              value={draft.ctaLabel}
              onChange={(e) => patchDraft({ ctaLabel: e.target.value })}
              onBlur={handleFieldBlur}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email-footer">{t("admin.email_design.field.footer")}</label>
            <textarea
              id="email-footer"
              rows={2}
              value={draft.footerNote}
              onChange={(e) => patchDraft({ footerNote: e.target.value })}
              onBlur={handleFieldBlur}
            />
          </div>

          <div className="admin-email-design-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? t("admin.email_design.saving") : t("admin.email_design.save")}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleResetLocale}>
              {t("admin.email_design.reset_locale")}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => void handleCopyHtml()}>
              {t("admin.email_design.copy_html")}
            </button>
            {isAuthTemplate ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => void handleCopySupabase()}
              >
                {t("admin.email_design.copy_supabase")}
              </button>
            ) : null}
          </div>
        </section>

        <section className="admin-email-design-preview card" aria-label={t("admin.email_design.preview_aria")}>
          <h2 className="admin-email-design-section-title">
            {t("admin.email_design.preview_heading")}
          </h2>
          <p className="admin-email-design-preview-subject">
            <strong>{t("admin.email_design.field.subject")}:</strong>{" "}
            {resolvedForExport.subject}
          </p>
          <div className="admin-email-design-preview-frame-wrap">
            <iframe
              title={t("admin.email_design.preview_aria")}
              className="admin-email-design-preview-frame"
              srcDoc={previewHtml}
              sandbox=""
            />
          </div>
        </section>
      </div>

      <section className="card admin-email-design-steps">
        <h2 className="admin-email-design-section-title">
          {t("admin.email_design.steps_heading")}
        </h2>
        <ol className="admin-email-design-steps-list">
          <li>{t("admin.email_design.step_edit")}</li>
          <li>{t("admin.email_design.step_save")}</li>
          <li>
            {isAuthTemplate
              ? t("admin.email_design.step_supabase")
              : t("admin.email_design.step_resend")}
          </li>
        </ol>
      </section>
    </div>
  );
}

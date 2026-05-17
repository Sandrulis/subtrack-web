"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { ReactNode } from "react";

export function AdminIntegrationsIntro() {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <h1 className="admin-page-title">{t("admin.integrations.heading")}</h1>
      <p className="admin-page-lead">
        {t("admin.integrations.lead_before_code")}{" "}
        <code className="admin-inline-code">public.integrations</code>
        {t("admin.integrations.lead_after_code")}
      </p>
    </div>
  );
}

export function AdminSystemIntro() {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <h1 className="admin-page-title">{t("admin.system.heading")}</h1>
      <p className="admin-page-lead">
        {t("admin.system.lead_before_code")}{" "}
        <code className="admin-inline-code">users.display_preferences</code>
        {t("admin.system.lead_after_code")}
      </p>
    </div>
  );
}

export function AdminLanguagesIntro() {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <h1 className="admin-page-title">{t("admin.languages.heading")}</h1>
      <p className="admin-page-lead">
        {t("admin.languages.lead_intro_codes")}
        <code className="admin-inline-code">en</code>
        {", "}
        <code className="admin-inline-code">lv</code>
        {t("admin.languages.lead_after_codes")}
        <strong>{t("admin.languages.term_self_name")}</strong>
        {t("admin.languages.lead_mid")}
        <strong>{t("admin.languages.term_one_star")}</strong>
        {t("admin.languages.lead_between_stars")}
        <strong>{t("admin.languages.term_system_default")}</strong>
        {t("admin.languages.lead_before_cookie")}
        <code className="admin-inline-code">subtrack_ui_locale</code>
        {t("admin.languages.lead_before_accept")}
        <code className="admin-inline-code">Accept-Language</code>
        {t("admin.languages.lead_after_accept")}
      </p>
    </div>
  );
}

export function AdminTranslationsIntro({ titleActions }: { titleActions?: ReactNode }) {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <div className="admin-page-title-row">
        <h1 className="admin-page-title">{t("admin.translations.heading")}</h1>
        {titleActions ? (
          <div className="admin-page-title-actions">{titleActions}</div>
        ) : null}
      </div>
      <p className="admin-page-lead">
        {t("admin.translations.lead_before_langs")}{" "}
        <strong>{t("admin.nav.languages")}</strong>
        {t("admin.translations.lead_mid_1")}
        <code className="admin-inline-code">_</code>
        {t("admin.translations.lead_mid_2")}
        <code className="admin-inline-code">{"{SYSTEM_NAME}"}</code>
        {" "}
        {t("admin.translations.lead_mid_or")}
        {" "}
        <code className="admin-inline-code">{"{SISTEM_NAME}"}</code>
        {t("admin.translations.lead_mid_placeholders")}
        <code className="admin-inline-code">/admin/system</code>.
        {" "}
        {t("admin.translations.lead_save_note")}
        <code className="admin-inline-code">site_translations</code>
        {t("admin.translations.lead_end")}
      </p>
    </div>
  );
}

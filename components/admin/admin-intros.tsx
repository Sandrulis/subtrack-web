"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { ReactNode } from "react";

export function AdminIntegrationsIntro() {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <h1 className="admin-page-title">{t("admin.integrations.heading")}</h1>
      <p className="admin-page-lead">{t("admin.integrations.lead_before_code")}</p>
    </div>
  );
}

export function AdminPwaIntro() {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <h1 className="admin-page-title">{t("admin.pwa.heading")}</h1>
      <p className="admin-page-lead">{t("admin.pwa.lead")}</p>
    </div>
  );
}

export function AdminTodosIntro({ titleActions }: { titleActions?: ReactNode }) {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <div className="admin-page-title-row">
        <h1 className="admin-page-title">{t("admin.todos.heading")}</h1>
        {titleActions ? (
          <div className="admin-page-title-actions">{titleActions}</div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminSystemIntro() {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <h1 className="admin-page-title">{t("admin.system.heading")}</h1>
      <p className="admin-page-lead">{t("admin.system.lead_before_code")}</p>
    </div>
  );
}

export function AdminLanguagesIntro() {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <h1 className="admin-page-title">{t("admin.languages.heading")}</h1>
      <p className="admin-page-lead">{t("admin.languages.lead_intro_codes")}</p>
    </div>
  );
}

export function AdminEmailDesignIntro() {
  const { t } = useSubtrackIntl();
  return (
    <div className="admin-page-head">
      <h1 className="admin-page-title">{t("admin.email_design.heading")}</h1>
      <p className="admin-page-lead">{t("admin.email_design.lead")}</p>
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
      <p className="admin-page-lead">{t("admin.translations.lead_before_langs")}</p>
    </div>
  );
}

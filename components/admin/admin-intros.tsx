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

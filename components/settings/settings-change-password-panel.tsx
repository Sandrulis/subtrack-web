"use client";

import { ChangePasswordForm } from "@/components/change-password-form";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

export function SettingsChangePasswordPanel() {
  const { t } = useSubtrackIntl();

  return (
    <section
      className="settings-hub-panel auth-card auth-card--form settings-hub-panel--password"
      aria-labelledby="settings-hub-password-heading"
    >
      <div className="settings-hub-panel-icon" aria-hidden="true">
        <i className="fa-solid fa-key" />
      </div>
      <h2 id="settings-hub-password-heading" className="settings-hub-panel-title">
        {t("auth.change_password.heading")}
      </h2>
      <p className="settings-hub-panel-lead">{t("auth.change_password.intro")}</p>
      <ChangePasswordForm recoveryMode={false} />
    </section>
  );
}

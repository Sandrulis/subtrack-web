"use client";

import Link from "next/link";
import { ChangePasswordForm } from "@/components/change-password-form";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  AppPageContentGate,
  useClientPageContentReady,
} from "@/components/app/app-page-content-gate";

/** Aizmirstā parole: bez paneļa navigācijas (`/change-password?recovery=1`). */
export function ChangePasswordFsView() {
  const { t } = useSubtrackIntl();
  const contentReady = useClientPageContentReady();

  return (
    <AppPageContentGate ready={contentReady}>
      <div className="auth-page-inner">
        <div className="auth-card auth-card--form">
          <div className="auth-card-icon">
            <i className="fa-solid fa-key fa-xl" aria-hidden="true" />
          </div>
          <h1>{t("auth.reset_password.heading")}</h1>
          <p className="auth-subtitle">{t("auth.reset_password.intro")}</p>

          <ChangePasswordForm recoveryMode />

          <p className="auth-footer">
            <Link href="/login">{t("auth.reset_password.back_login")}</Link>
          </p>
        </div>
      </div>
    </AppPageContentGate>
  );
}

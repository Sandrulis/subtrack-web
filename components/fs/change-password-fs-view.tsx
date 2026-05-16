"use client";

import Link from "next/link";
import { ChangePasswordForm } from "@/components/change-password-form";
import { FlashParamToast } from "@/components/flash-param-toast";
import { NavDash } from "@/components/nav-dash";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

export function ChangePasswordFsView({
  userDisplay,
  flashError,
  flashMessage,
}: {
  userDisplay?: NavUserDisplay | null;
  flashError?: string;
  flashMessage?: string;
}) {
  const { t } = useSubtrackIntl();
  return (
    <>
      <NavDash active="" userDisplay={userDisplay} />
      <div className="auth-page-inner">
        <div className="auth-card auth-card--form">
          <div className="auth-card-icon">
            <i className="fa-solid fa-key fa-xl" aria-hidden="true" />
          </div>
          <h1>{t("auth.change_password.heading")}</h1>
          <p className="auth-subtitle">{t("auth.change_password.intro")}</p>

          <ChangePasswordForm />

          <p className="auth-footer">
            <Link href="/dashboard">{t("auth.change_password.back_dashboard")}</Link>
          </p>
        </div>
      </div>

      <footer className="landing-footer">
        <SiteStandardCopyrightNotice />
      </footer>

      <div className="toast-container toast-container--auth-pages">
        <FlashParamToast error={flashError} message={flashMessage} />
      </div>
    </>
  );
}

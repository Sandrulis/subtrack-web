"use client";

import Link from "next/link";
import { ChangePasswordForm } from "@/components/change-password-form";
import { FlashParamToast } from "@/components/flash-param-toast";
import { NavDash } from "@/components/nav-dash";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  AppPageContentGate,
  useClientPageContentReady,
} from "@/components/app/app-page-content-gate";

export function ChangePasswordFsView({
  userDisplay,
  flashError,
  flashMessage,
  recoveryMode = false,
}: {
  userDisplay?: NavUserDisplay | null;
  flashError?: string;
  flashMessage?: string;
  /** Aizmirstā parole: bez pašreizējās paroles, bez paneļa navigācijas. */
  recoveryMode?: boolean;
}) {
  const { t } = useSubtrackIntl();
  const contentReady = useClientPageContentReady();
  const inner = (
    <AppPageContentGate ready={contentReady}>
    <div className="auth-page-inner">
      <div className="auth-card auth-card--form">
        <div className="auth-card-icon">
          <i className="fa-solid fa-key fa-xl" aria-hidden="true" />
        </div>
        <h1>
          {recoveryMode
            ? t("auth.reset_password.heading")
            : t("auth.change_password.heading")}
        </h1>
        <p className="auth-subtitle">
          {recoveryMode
            ? t("auth.reset_password.intro")
            : t("auth.change_password.intro")}
        </p>

        <ChangePasswordForm recoveryMode={recoveryMode} />

        <p className="auth-footer">
          {recoveryMode ? (
            <Link href="/login">{t("auth.reset_password.back_login")}</Link>
          ) : (
            <Link href="/dashboard">{t("auth.change_password.back_dashboard")}</Link>
          )}
        </p>
      </div>
    </div>
    </AppPageContentGate>
  );

  if (recoveryMode) {
    return inner;
  }

  return (
    <>
      <NavDash active="" userDisplay={userDisplay} />
      {inner}
      <SiteLandingFooter showAuthedActionLinks={Boolean(userDisplay)} />
      <div className="toast-container toast-container--auth-pages">
        <FlashParamToast error={flashError} message={flashMessage} />
      </div>
    </>
  );
}

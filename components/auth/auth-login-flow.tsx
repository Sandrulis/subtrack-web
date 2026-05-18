"use client";

import Link from "next/link";
import { AuthFormPendingFieldset } from "@/components/auth/auth-form-pending-fieldset";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { LoginSocialButtons } from "@/components/login-social-buttons";
import { signInWithPasswordAction } from "@/lib/auth/actions";

export function AuthLoginFlow({
  nextPath,
  oauthGoogleEnabled,
  oauthAppleEnabled,
}: {
  nextPath: string;
  oauthGoogleEnabled: boolean;
  oauthAppleEnabled: boolean;
}) {
  const { t } = useSubtrackIntl();

  return (
    <div className="auth-card auth-card--form auth-card--login">
      <h1>{t("auth.login.welcome_title")}</h1>
      <p className="auth-subtitle">{t("auth.login.subtitle")}</p>

      <form action={signInWithPasswordAction} noValidate>
        <input type="hidden" name="next" value={nextPath} />
        <AuthFormPendingFieldset>
          <div className="form-group">
            <label htmlFor="email">{t("auth.field.email")}</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder={t("auth.login.email_placeholder")}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {t("auth.field.password")}
              <Link href="/forgot-password" className="forgot-link">
                {t("auth.login.forgot_password")}
              </Link>
            </label>
            <div className="form-password-wrap">
              <input
                type="password"
                id="password"
                name="password"
                placeholder={t("auth.login.password_placeholder")}
                autoComplete="current-password"
                required
                className="input-has-password-toggle"
              />
              <button
                type="button"
                className="password-toggle-btn js-password-toggle"
                data-password-for="password"
                aria-label={t("auth.aria.toggle_password")}
                aria-pressed="false"
              >
                <i className="fa-regular fa-eye" aria-hidden="true" />
              </button>
            </div>
          </div>
        </AuthFormPendingFieldset>

        <div className="auth-submit-wrap">
          <AuthSubmitButton
            labelKey="auth.submit.login"
            pendingLabelKey="auth.status.login_pending"
            statusDetailKey="auth.status.login_detail"
          />
        </div>
      </form>

      <LoginSocialButtons
        googleEnabled={oauthGoogleEnabled}
        appleEnabled={oauthAppleEnabled}
        nextPath={nextPath}
      />

      <p className="auth-footer">
        {t("auth.login.no_account")}{" "}
        <Link href="/signup">{t("auth.login.signup_link")}</Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoginSocialButtons } from "@/components/login-social-buttons";
import { SignupForm } from "@/components/signup-form";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { signUpAction, type SignupFormState } from "@/lib/auth/actions";

const initialSignupState: SignupFormState = { ok: false };

export function AuthSignupCard({
  oauthGoogleEnabled,
  oauthAppleEnabled,
}: {
  oauthGoogleEnabled: boolean;
  oauthAppleEnabled: boolean;
}) {
  const { t } = useSubtrackIntl();
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialSignupState,
  );

  if (state.ok) {
    const emailTrimmed = state.email?.trim() ?? "";

    return (
      <div className="auth-card auth-card--form" id="card-signup-confirm-email">
        <div
          className="auth-card-icon"
          style={{ textAlign: "center", marginBottom: 18, color: "var(--primary)" }}
        >
          <i className="fa-solid fa-circle-check fa-3x" aria-hidden="true" />
        </div>
        <h1 style={{ textAlign: "center" }}>
          {t("auth.signup.confirm_email.heading")}
        </h1>
        <p className="auth-subtitle" style={{ textAlign: "center" }}>
          {t("auth.signup.confirm_email.lead")}
          {emailTrimmed ? (
            <>
              <br />
              <strong>{emailTrimmed}</strong>
            </>
          ) : null}
        </p>

        <div className="auth-submit-wrap">
          <Link href="/login" className="btn btn-primary btn-block">
            {t("auth.signup.confirm_email.back_login")}
          </Link>
        </div>

        <p
          className="auth-signup-confirm-hint"
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: 16,
          }}
        >
          {t("auth.signup.confirm_email.spam_hint")}{" "}
          <Link href="/signup" className="forgot-link">
            {t("auth.signup.confirm_email.try_again")}
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card auth-card--form">
      <h1>{t("auth.signup.title")}</h1>
      <p className="auth-subtitle">{t("auth.signup.subtitle")}</p>

      <SignupForm formAction={formAction} pending={pending} formError={state.error} />

      <LoginSocialButtons
        googleEnabled={oauthGoogleEnabled}
        appleEnabled={oauthAppleEnabled}
      />

      <p className="auth-footer">
        {t("auth.signup.has_account")}{" "}
        <Link href="/login">{t("auth.submit.login")}</Link>
      </p>
    </div>
  );
}

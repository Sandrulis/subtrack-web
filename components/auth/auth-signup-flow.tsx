"use client";

import Link from "next/link";
import { LoginSocialButtons } from "@/components/login-social-buttons";
import { SignupForm } from "@/components/signup-form";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

export function AuthSignupCard() {
  const { t } = useSubtrackIntl();

  return (
    <div className="auth-card auth-card--form">
      <h1>{t("auth.signup.title")}</h1>
      <p className="auth-subtitle">{t("auth.signup.subtitle")}</p>

      <SignupForm />

      <LoginSocialButtons />

      <p className="auth-footer">
        {t("auth.signup.has_account")}{" "}
        <Link href="/login">{t("auth.submit.login")}</Link>
      </p>
    </div>
  );
}

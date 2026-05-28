"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthFormPendingFieldset } from "@/components/auth/auth-form-pending-fieldset";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import Link from "next/link";
import { signupEmailExistsAction } from "@/lib/auth/actions";
import {
  PASSWORD_STRENGTH_META,
  scorePassword,
} from "@/lib/auth/password-strength";

/** Vienkārša e-pasta formāta pārbaude (bez pilnas RFC). */
function isValidEmail(value: string): boolean {
  const e = value.trim();
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function SignupForm({
  formAction,
  pending = false,
  formError,
  initialEmail = "",
}: {
  formAction: (payload: FormData) => void;
  pending?: boolean;
  formError?: string;
  initialEmail?: string;
}) {
  const { t } = useSubtrackIntl();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(initialEmail.trim());
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const debouncedEmail = useDebounced(email, 450);

  const [emailCheck, setEmailCheck] = useState<{
    email: string;
    exists: boolean;
    unavailable?: boolean;
  } | null>(null);
  const [checkInflight, setCheckInflight] = useState<string | null>(null);
  /** Palielina, lai pēc blur atkārtoti vaicātu DB (piem. kad noņemts retired_signup_emails). */
  const [emailRecheckSeq, setEmailRecheckSeq] = useState(0);

  const strengthScore = useMemo(() => scorePassword(password), [password]);
  const strength = PASSWORD_STRENGTH_META[strengthScore];
  const strengthLabel = useMemo(() => {
    const k = `auth.pass_strength.level_${Math.min(Math.max(strengthScore, 0), 4)}`;
    const v = t(k);
    return v !== k ? v : strength.label;
  }, [strengthScore, strength.label, t]);

  const confirmMismatch =
    passwordConfirm.length > 0 && password !== passwordConfirm;

  const emailLooksValid = useMemo(
    () => isValidEmail(debouncedEmail),
    [debouncedEmail],
  );

  const emailTrimmed = email.trim();
  const emailFormatInvalid =
    emailTrimmed.length > 0 && !isValidEmail(emailTrimmed);

  const normalizedDebounced = useMemo(
    () => debouncedEmail.trim().toLowerCase(),
    [debouncedEmail],
  );

  useEffect(() => {
    if (!emailLooksValid) return;

    const target = normalizedDebounced;
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setCheckInflight(target);
    });

    signupEmailExistsAction(debouncedEmail.trim()).then((res) => {
      if (!active) return;
      if (res.unavailable) {
        setEmailCheck({ email: target, exists: false, unavailable: true });
      } else {
        setEmailCheck({ email: target, exists: res.exists });
      }
      setCheckInflight((prev) => (prev === target ? null : prev));
    });

    return () => {
      active = false;
    };
  }, [debouncedEmail, emailLooksValid, normalizedDebounced, emailRecheckSeq]);

  const checkingEmail =
    emailLooksValid &&
    checkInflight !== null &&
    checkInflight === normalizedDebounced;

  const emailCheckUnavailable =
    emailLooksValid &&
    emailCheck !== null &&
    emailCheck.email === normalizedDebounced &&
    emailCheck.unavailable === true;

  const emailTaken =
    emailLooksValid &&
    emailCheck !== null &&
    emailCheck.email === normalizedDebounced &&
    emailCheck.exists &&
    !emailCheck.unavailable;

  const submitDisabled =
    emailTaken ||
    emailCheckUnavailable ||
    !isValidEmail(emailTrimmed) ||
    password !== passwordConfirm ||
    checkingEmail ||
    !firstName.trim() ||
    !lastName.trim() ||
    !password ||
    password.length < 8;

  const emailFieldInvalid = emailFormatInvalid || emailTaken;

  const emailInputClass =
    emailTaken
      ? "input--signup-invalid"
      : emailFormatInvalid
        ? "input--signup-email-format"
        : undefined;

  return (
    <form action={formAction} noValidate>
      <AuthFormPendingFieldset>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="first_name">{t("auth.field.first_name")}</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            placeholder={t("auth.place.first_name")}
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">{t("auth.field.last_name")}</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            placeholder={t("auth.place.last_name")}
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email">{t("auth.field.email")}</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder={t("auth.login.email_placeholder")}
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailCheck(null);
          }}
          onBlur={() => {
            if (!isValidEmail(emailTrimmed)) return;
            setEmailCheck(null);
            setEmailRecheckSeq((n) => n + 1);
          }}
          aria-invalid={emailFieldInvalid}
          aria-describedby={
            emailFormatInvalid
              ? "email-format-hint"
              : emailTaken
                ? "email-taken-hint"
                : emailCheckUnavailable
                  ? "email-check-unavailable-hint"
                  : undefined
          }
          className={emailInputClass}
        />
        {emailFormatInvalid ? (
          <p
            id="email-format-hint"
            className="form-hint form-hint--email-format"
            role="alert"
          >
            {t("auth.validation.email_hint")}
          </p>
        ) : emailTaken ? (
          <p
            id="email-taken-hint"
            className="form-hint form-hint--error"
            role="alert"
          >
            {t("auth.signup.email_taken")}
          </p>
        ) : emailCheckUnavailable ? (
          <p
            id="email-check-unavailable-hint"
            className="form-hint form-hint--error"
            role="alert"
          >
            {t("auth.signup.email_check_unavailable")}
          </p>
        ) : null}
      </div>

      <div className="form-group">
        <label htmlFor="password">{t("auth.field.password")}</label>
        <div className="form-password-wrap">
          <input
            type="password"
            id="password"
            name="password"
            placeholder={t("auth.login.password_placeholder")}
            autoComplete="new-password"
            required
            minLength={8}
            className="input-has-password-toggle"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        {password.length > 0 ? (
          <div className="password-strength" aria-live="polite">
            <div
              className={`password-strength-label password-strength-label--${strength.tone}`}
            >
              {t("auth.pass_strength.label_prefix")}
              {strengthLabel}
            </div>
            <div className="password-strength-bars" role="presentation">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`password-strength-bar password-strength-bar--${strength.tone}${
                    i < strengthScore ? " is-filled" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="form-hint form-hint--below-password">
            {t("auth.signup.min_password")}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password_confirm">{t("auth.signup.confirm_password")}</label>
        <div
          className={
            confirmMismatch
              ? "form-password-wrap form-password-wrap--invalid-match"
              : "form-password-wrap"
          }
        >
          <input
            type="password"
            id="password_confirm"
            name="password_confirm"
            placeholder={t("auth.login.password_placeholder")}
            autoComplete="new-password"
            required
            minLength={8}
            className={`input-has-password-toggle${confirmMismatch ? " input--signup-invalid" : ""}`}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            aria-invalid={confirmMismatch}
          />
          <button
            type="button"
            className="password-toggle-btn js-password-toggle"
            data-password-for="password_confirm"
            aria-label={t("auth.aria.toggle_password")}
            aria-pressed="false"
          >
            <i className="fa-regular fa-eye" aria-hidden="true" />
          </button>
        </div>
        {confirmMismatch ? (
          <p className="form-hint form-hint--error" role="alert">
            {t("auth.signup.password_mismatch")}
          </p>
        ) : null}
      </div>
      </AuthFormPendingFieldset>

      {formError ? (
        <p className="form-hint form-hint--error" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="auth-submit-wrap">
        <AuthSubmitButton
          labelKey="auth.signup.submit"
          pendingLabelKey="auth.status.signup_pending"
          statusDetailKey="auth.status.signup_detail"
          disabled={submitDisabled}
          pending={pending}
        />
      </div>

      <p className="auth-legal-note">
        {t("auth.signup.legal_intro")}
        <Link href="/terms">{t("auth.signup.legal_terms")}</Link>
        {t("auth.signup.legal_and")}
        <Link href="/privacy">{t("auth.signup.legal_privacy")}</Link>
      </p>
    </form>
  );
}

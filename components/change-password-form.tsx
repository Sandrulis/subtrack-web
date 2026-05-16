"use client";

import { useMemo, useState } from "react";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { changePasswordAction } from "@/lib/auth/actions";
import {
  PASSWORD_STRENGTH_META,
  scorePassword,
} from "@/lib/auth/password-strength";

export function ChangePasswordForm() {
  const { t } = useSubtrackIntl();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strengthScore = useMemo(
    () => scorePassword(newPassword),
    [newPassword],
  );
  const strength = PASSWORD_STRENGTH_META[strengthScore];
  const strengthLabel = useMemo(() => {
    const k = `auth.pass_strength.level_${Math.min(Math.max(strengthScore, 0), 4)}`;
    const v = t(k);
    return v !== k ? v : strength.label;
  }, [strength.label, strengthScore, t]);

  const confirmMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const submitDisabled =
    confirmMismatch ||
    !newPassword ||
    newPassword.length < 8 ||
    !confirmPassword;

  return (
    <form action={changePasswordAction} noValidate>
      <div className="form-group">
        <label htmlFor="pwd-current">{t("auth.change_password.password_current")}</label>
        <div className="form-password-wrap">
          <input
            type={showCurrent ? "text" : "password"}
            id="pwd-current"
            name="pwd_current"
            autoComplete="current-password"
            placeholder="●●●●●●●●"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-has-password-toggle"
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowCurrent((v) => !v)}
            aria-label={showCurrent ? t("auth.change_password.toggle_hide") : t("auth.change_password.toggle_show")}
            aria-pressed={showCurrent}
          >
            <i
              className={
                showCurrent ? "fa-solid fa-eye-slash" : "fa-regular fa-eye"
              }
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="pwd-new">{t("auth.change_password.password_new")}</label>
        <div className="form-password-wrap">
          <input
            type={showNew ? "text" : "password"}
            id="pwd-new"
            name="pwd_new"
            autoComplete="new-password"
            placeholder="●●●●●●●●"
            minLength={8}
            required
            className="input-has-password-toggle"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowNew((v) => !v)}
            aria-label={showNew ? t("auth.change_password.toggle_hide") : t("auth.change_password.toggle_show")}
            aria-pressed={showNew}
          >
            <i
              className={
                showNew ? "fa-solid fa-eye-slash" : "fa-regular fa-eye"
              }
              aria-hidden="true"
            />
          </button>
        </div>
        {newPassword.length > 0 ? (
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
            {t("auth.change_password.hint_min")}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="pwd-new2">{t("auth.change_password.password_confirm")}</label>
        <div
          className={
            confirmMismatch
              ? "form-password-wrap form-password-wrap--invalid-match"
              : "form-password-wrap"
          }
        >
          <input
            type={showConfirm ? "text" : "password"}
            id="pwd-new2"
            name="pwd_new2"
            autoComplete="new-password"
            placeholder="●●●●●●●●"
            minLength={8}
            required
            className={`input-has-password-toggle${confirmMismatch ? " input--signup-invalid" : ""}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={confirmMismatch}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? t("auth.change_password.toggle_hide") : t("auth.change_password.toggle_show")}
            aria-pressed={showConfirm}
          >
            <i
              className={
                showConfirm ? "fa-solid fa-eye-slash" : "fa-regular fa-eye"
              }
              aria-hidden="true"
            />
          </button>
        </div>
        {confirmMismatch ? (
          <p className="form-hint form-hint--error" role="alert">
            {t("auth.change_password.mismatch")}
          </p>
        ) : null}
      </div>

      <div className="auth-submit-wrap">
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitDisabled}
        >
          {t("auth.change_password.submit")}
        </button>
      </div>
    </form>
  );
}

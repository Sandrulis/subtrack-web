"use client";

import { useMemo, useState } from "react";
import { changePasswordAction } from "@/lib/auth/actions";
import {
  PASSWORD_STRENGTH_META,
  scorePassword,
} from "@/lib/auth/password-strength";

export function ChangePasswordForm() {
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
        <label htmlFor="pwd-current">Pašreizējā parole</label>
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
            aria-label={showCurrent ? "Slēpt paroli" : "Rādīt paroli"}
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
        <label htmlFor="pwd-new">Jaunā parole</label>
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
            aria-label={showNew ? "Slēpt paroli" : "Rādīt paroli"}
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
              Paroles stiprība: {strength.label}
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
            Vismaz 8 rakstzīmes
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="pwd-new2">Atkārtot jauno paroli</label>
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
            aria-label={showConfirm ? "Slēpt paroli" : "Rādīt paroli"}
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
            Paroles nesakrīt.
          </p>
        ) : null}
      </div>

      <div className="auth-submit-wrap">
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitDisabled}
        >
          Saglabāt
        </button>
      </div>
    </form>
  );
}

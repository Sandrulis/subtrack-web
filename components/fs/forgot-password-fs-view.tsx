"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";
import {
  requestPasswordResetAction,
  type ForgotPasswordFormState,
} from "@/lib/auth/actions";

const initialState: ForgotPasswordFormState = { ok: false };

export function ForgotPasswordFsView() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <>
      <div className="auth-page-inner">
        {!state.ok ? (
          <div className="auth-card auth-card--form" id="card-request">
            <div style={{ marginBottom: 16, color: "var(--primary)" }}>
              <i className="fa-solid fa-lock fa-2x" />
            </div>
            <h1>Aizmirsi paroli?</h1>
            <p className="auth-subtitle">
              Ievadiet savu e-pastu un mēs nosūtīsim saiti paroles
              atjaunošanai.
            </p>

            <form action={formAction} id="forgot-form" noValidate>
              <fieldset disabled={pending}>
                <div className="form-group">
                  <label htmlFor="email">E-pasts</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="jusu@epasts.lv"
                    autoComplete="email"
                    required
                  />
                </div>
              </fieldset>

              {state.error ? (
                <p className="form-hint form-hint--error" role="alert">
                  {state.error}
                </p>
              ) : null}

              <div className="auth-submit-wrap">
                <AuthSubmitButton
                  label="Nosūtīt atjaunošanas saiti"
                  pendingLabelKey="auth.status.forgot_pending"
                  statusDetailKey="auth.status.forgot_detail"
                  pending={pending}
                />
              </div>
            </form>

            <p className="auth-footer">
              <Link href="/login">
                <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
                Atpakaļ uz pieteikšanos
              </Link>
            </p>
          </div>
        ) : (
          <div className="auth-card auth-card--form" id="card-success">
            <div
              style={{
                marginBottom: 18,
                color: "var(--primary)",
                textAlign: "center",
              }}
            >
              <i className="fa-solid fa-circle-check fa-3x" />
            </div>
            <h1 style={{ textAlign: "center" }}>Pārbaudiet e-pastu</h1>
            <p className="auth-subtitle" style={{ textAlign: "center" }}>
              Ja šāds konts eksistē, mēs nosūtījām paroles atjaunošanas saiti uz
              norādīto e-pastu.
            </p>

            <div className="auth-submit-wrap">
              <Link href="/login" className="btn btn-primary btn-block">
                Atpakaļ uz pieteikšanos
              </Link>
            </div>

            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                marginTop: 16,
              }}
            >
              Nesaņēmāt e-pastu? Pārbaudiet surogātpastu vai{" "}
              <Link href="/forgot-password" className="forgot-link">
                mēģiniet vēlreiz
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      <footer className="landing-footer">
        <SiteStandardCopyrightNotice />
      </footer>
    </>
  );
}

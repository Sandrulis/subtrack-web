"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";

export function ForgotPasswordFsView() {

  const [step, setStep] = useState<"request" | "success">("request");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) return;
    setStep("success");
  }

  return (
    <>
      <div className="auth-page-inner">
        {step === "request" ? (
          <div className="auth-card auth-card--form" id="card-request">
            <div style={{ marginBottom: 16, color: "var(--primary)" }}>
              <i className="fa-solid fa-lock fa-2x" />
            </div>
            <h1>Aizmirsi paroli?</h1>
            <p className="auth-subtitle">
              Ievadiet savu e-pastu un mēs nosūtīsim saiti paroles
              atjaunošanai.
            </p>

            <form onSubmit={handleSubmit} id="forgot-form" noValidate>
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

              <div className="auth-submit-wrap">
                <button type="submit" className="btn btn-primary btn-block">
                  Nosūtīt atjaunošanas saiti
                </button>
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
              <button
                type="button"
                className="forgot-link"
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  font: "inherit",
                }}
                onClick={() => setStep("request")}
              >
                mēģiniet vēlreiz
              </button>
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

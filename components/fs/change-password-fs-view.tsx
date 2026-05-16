"use client";

import Link from "next/link";
import { ChangePasswordForm } from "@/components/change-password-form";
import { FlashParamToast } from "@/components/flash-param-toast";
import { NavDash } from "@/components/nav-dash";
import type { NavUserDisplay } from "@/lib/auth/user-display";

export function ChangePasswordFsView({
  userDisplay,
  flashError,
  flashMessage,
}: {
  userDisplay?: NavUserDisplay | null;
  flashError?: string;
  flashMessage?: string;
}) {
  const year = new Date().getFullYear();

  return (
    <>
      <NavDash active="" userDisplay={userDisplay} />
      <div className="auth-page-inner">
        <div className="auth-card auth-card--form">
          <div className="auth-card-icon">
            <i className="fa-solid fa-key fa-xl" aria-hidden="true" />
          </div>
          <h1>Mainīt paroli</h1>
          <p className="auth-subtitle">
            Ievadiet pašreizējo un jauno paroli. Jaunajai parolei jābūt vismaz 8
            rakstzīmēm.
          </p>

          <ChangePasswordForm />

          <p className="auth-footer">
            <Link href="/dashboard">Atpakaļ uz paneli</Link>
          </p>
        </div>
      </div>

      <footer className="landing-footer">
        <p>
          &copy; {year} SubTrack. Visi tiesības aizsargātas.
        </p>
      </footer>

      <div className="toast-container toast-container--auth-pages">
        <FlashParamToast error={flashError} message={flashMessage} />
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { NavDash } from "@/components/nav-dash";
import { FsScripts } from "@/components/fs/load-fs-scripts";

const HELPERS_ONLY = ["/fs/js/subscriptions-helpers.js"] as const;

export function ChangePasswordFsView() {
  const year = new Date().getFullYear();

  useEffect(() => {
    const form = document.getElementById(
      "change-password-form",
    ) as HTMLFormElement | null;
    if (!form) return;

    const onSubmit = (e: Event) => {
      e.preventDefault();
      const cur = (
        document.getElementById("pwd-current") as HTMLInputElement
      ).value;
      const nw = (document.getElementById("pwd-new") as HTMLInputElement).value;
      const nw2 = (document.getElementById("pwd-new2") as HTMLInputElement)
        .value;
      if (!cur || !nw || !nw2) {
        window.showToast?.("Aizpildiet visus laukus.", "error");
        return;
      }
      if (nw.length < 8) {
        window.showToast?.("Jaunajai parolei jābūt vismaz 8 rakstzīmes.", "error");
        return;
      }
      if (nw !== nw2) {
        window.showToast?.("Jaunās paroles nesakrīt.", "error");
        return;
      }
      window.showToast?.("Prototips: parole netika nosūtīta uz serveri.", "success");
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  return (
    <>
      <NavDash active="" />
      <div className="auth-page-inner">
        <div className="auth-card auth-card--form">
          <div className="auth-card-icon">
            <i className="fa-solid fa-key fa-xl" aria-hidden="true" />
          </div>
          <h1>Mainīt paroli</h1>
          <p className="auth-subtitle">
            Ievadiet pašreizējo un jauno paroli. Šī prototipa lapā dati netiek
            saglabāti serverī.
          </p>

          <form action="#" method="post" id="change-password-form" noValidate>
            <div className="form-group">
              <label htmlFor="pwd-current">Pašreizējā parole</label>
              <input
                type="password"
                id="pwd-current"
                name="pwd_current"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pwd-new">Jaunā parole</label>
              <input
                type="password"
                id="pwd-new"
                name="pwd_new"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pwd-new2">Atkārtot jauno paroli</label>
              <input
                type="password"
                id="pwd-new2"
                name="pwd_new2"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <p className="form-hint">Vismaz 8 rakstzīmes</p>
            </div>

            <div className="auth-submit-wrap">
              <button type="submit" className="btn btn-primary btn-block">
                Saglabāt
              </button>
            </div>
          </form>

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

      <div className="toast-container" id="toast-container" />

      <FsScripts srcs={HELPERS_ONLY} />
    </>
  );
}

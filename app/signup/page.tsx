import type { Metadata } from "next";
import Link from "next/link";
import { NavLanding } from "@/components/nav-landing";
import { FsScripts } from "@/components/fs/load-fs-scripts";

const SIGNUP_SCRIPTS = ["/fs/js/signup.js"] as const;

export const metadata: Metadata = {
  title: "Reģistrēties",
};

export default function SignupPage() {
  const year = new Date().getFullYear();
  return (
    <div className="auth-page">
      <NavLanding active="signup" />
      <div className="auth-page-inner">
        <div className="auth-card auth-card--form">
          <h1>Izveidot kontu</h1>
          <p className="auth-subtitle">
            Sāciet izsekot saviem abonementiem jau šodien
          </p>

          <form action="#" method="post" noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">Vārds</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  placeholder="Jānis"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Uzvārds</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  placeholder="Bērziņš"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

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

            <div className="form-group">
              <label htmlFor="password">Parole</label>
              <div className="form-password-wrap">
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="●●●●●●●●"
                  autoComplete="new-password"
                  required
                  className="input-has-password-toggle"
                />
                <button
                  type="button"
                  className="password-toggle-btn js-password-toggle"
                  data-password-for="password"
                  aria-label="Rādīt paroli"
                  aria-pressed="false"
                >
                  <i className="fa-regular fa-eye" aria-hidden="true" />
                </button>
              </div>
              <p className="form-hint form-hint--below-password">
                Vismaz 8 rakstzīmes
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="password_confirm">Apstiprināt paroli</label>
              <div className="form-password-wrap">
                <input
                  type="password"
                  id="password_confirm"
                  name="password_confirm"
                  placeholder="●●●●●●●●"
                  autoComplete="new-password"
                  required
                  className="input-has-password-toggle"
                />
                <button
                  type="button"
                  className="password-toggle-btn js-password-toggle"
                  data-password-for="password_confirm"
                  aria-label="Rādīt paroli"
                  aria-pressed="false"
                >
                  <i className="fa-regular fa-eye" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="auth-submit-wrap">
              <button type="submit" className="btn btn-primary btn-block">
                Izveidot kontu
              </button>
            </div>

            <p className="auth-legal-note">
              Reģistrējoties, jūs piekrītat mūsu{" "}
              <a href="#">lietošanas noteikumiem</a> un{" "}
              <a href="#">privātuma politikai</a>.
            </p>
          </form>

          <p className="auth-footer">
            Jau ir konts? <Link href="/login">Ieiet</Link>
          </p>
        </div>
      </div>

      <footer className="landing-footer">
        <p>
          &copy; {year} SubTrack. Visi tiesības aizsargātas.
        </p>
      </footer>

      <FsScripts srcs={SIGNUP_SCRIPTS} />
    </div>
  );
}

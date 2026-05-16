import type { Metadata } from "next";
import Link from "next/link";
import { LoginSocialButtons } from "@/components/login-social-buttons";
import { NavLanding } from "@/components/nav-landing";

export const metadata: Metadata = {
  title: "Ieiet",
};

export default function LoginPage() {
  const year = new Date().getFullYear();
  return (
    <div className="auth-page">
      <NavLanding active="login" />
      <div className="auth-page-inner">
        <div className="auth-card auth-card--form auth-card--login">
          <h1>Laipni lūdzam atpakaļ</h1>
          <p className="auth-subtitle">Ievadiet savus pieteikšanās datus</p>

          <form action="#" method="post" noValidate>
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
              <label htmlFor="password">
                Parole
                <Link href="/forgot-password" className="forgot-link">
                  Aizmirsi paroli?
                </Link>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="●●●●●●●●"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="auth-submit-wrap">
              <button type="submit" className="btn btn-primary btn-block">
                Ieiet
              </button>
            </div>
          </form>

          <LoginSocialButtons />

          <p className="auth-footer">
            Nav konta? <Link href="/signup">Reģistrēties</Link>
          </p>
        </div>
      </div>

      <footer className="landing-footer">
        <p>
          &copy; {year} SubTrack. Visi tiesības aizsargātas.
        </p>
      </footer>
    </div>
  );
}

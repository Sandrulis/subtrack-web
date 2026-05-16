import type { Metadata } from "next";
import Link from "next/link";
import { AuthToastsHost } from "@/components/auth-toasts-host";
import { FsScripts } from "@/components/fs/load-fs-scripts";
import { LoginSocialButtons } from "@/components/login-social-buttons";
import { NavLanding } from "@/components/nav-landing";
import { signInWithPasswordAction } from "@/lib/auth/actions";

/** Paroles redzamības slēdzējiem (sk. `signup.js`). */
const LOGIN_PAGE_SCRIPTS = ["/fs/js/signup.js"] as const;

export const metadata: Metadata = {
  title: "Ieiet",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const year = new Date().getFullYear();
  const sp = await searchParams;
  const next =
    sp.next?.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/dashboard";

  return (
    <div className="auth-page">
      <NavLanding active="login" />
      <AuthToastsHost urlError={sp.error} urlMessage={sp.message}>
        <div className="auth-page-inner">
          <div className="auth-card auth-card--form auth-card--login">
            <h1>Laipni lūdzam atpakaļ</h1>
            <p className="auth-subtitle">Ievadiet savus pieteikšanās datus</p>

            <form action={signInWithPasswordAction} noValidate>
              <input type="hidden" name="next" value={next} />
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
                <div className="form-password-wrap">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="●●●●●●●●"
                    autoComplete="current-password"
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

        <FsScripts srcs={LOGIN_PAGE_SCRIPTS} />
      </AuthToastsHost>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AuthToastsHost } from "@/components/auth-toasts-host";
import { FsScripts } from "@/components/fs/load-fs-scripts";
import { LoginSocialButtons } from "@/components/login-social-buttons";
import { NavLanding } from "@/components/nav-landing";
import { SignupForm } from "@/components/signup-form";

const SIGNUP_SCRIPTS = ["/fs/js/signup.js"] as const;

export const metadata: Metadata = {
  title: "Reģistrēties",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const year = new Date().getFullYear();
  const sp = await searchParams;

  return (
    <div className="auth-page">
      <NavLanding active="signup" />
      <AuthToastsHost urlError={sp.error}>
        <div className="auth-page-inner">
          <div className="auth-card auth-card--form">
            <h1>Izveidot kontu</h1>
            <p className="auth-subtitle">
              Sāciet izsekot saviem abonementiem jau šodien
            </p>

            <SignupForm />

            <LoginSocialButtons />

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
      </AuthToastsHost>
    </div>
  );
}

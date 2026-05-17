import type { Metadata } from "next";
import { AuthSignupCard } from "@/components/auth/auth-signup-flow";
import { AuthToastsHost } from "@/components/auth-toasts-host";
import { FsScripts } from "@/components/fs/load-fs-scripts";
import { NavLanding } from "@/components/nav-landing";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";
import { getLoginSocialIntegrationFlags } from "@/lib/integrations/login-social-flags";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

const SIGNUP_SCRIPTS = ["/fs/js/signup.js"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.auth.signup"),
  };
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  const { googleEnabled: oauthGoogleEnabled, appleEnabled: oauthAppleEnabled } =
    await getLoginSocialIntegrationFlags();

  return (
    <div className="auth-page">
      <NavLanding active="signup" />
      <AuthToastsHost urlError={sp.error}>
        <div className="auth-page-inner">
          <AuthSignupCard
            oauthGoogleEnabled={oauthGoogleEnabled}
            oauthAppleEnabled={oauthAppleEnabled}
          />
        </div>

        <footer className="landing-footer">
          <SiteStandardCopyrightNotice />
        </footer>

        <FsScripts srcs={SIGNUP_SCRIPTS} />
      </AuthToastsHost>
    </div>
  );
}

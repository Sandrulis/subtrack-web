import type { Metadata } from "next";
import { AuthSignupCard } from "@/components/auth/auth-signup-flow";
import { AuthToastsHost } from "@/components/auth-toasts-host";
import { FsScripts } from "@/components/fs/load-fs-scripts";
import { NavLanding } from "@/components/nav-landing";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import { getLoginSocialIntegrationFlags } from "@/lib/integrations/login-social-flags";
import { isValidInviteEmail, normalizeInviteEmail } from "@/lib/family-sharing/family-sharing-server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

const SIGNUP_SCRIPTS = ["/fs/js/signup.js"] as const;

function signupEmailFromSearchParam(raw: string | undefined): string {
  const email = normalizeInviteEmail(raw ?? "");
  return isValidInviteEmail(email) ? email : "";
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.auth.signup"),
  };
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const sp = await searchParams;
  const initialEmail = signupEmailFromSearchParam(sp.email);

  const { googleEnabled: oauthGoogleEnabled, appleEnabled: oauthAppleEnabled } =
    await getLoginSocialIntegrationFlags();

  return (
    <div className="auth-page">
      <NavLanding active="signup" />
      <AuthToastsHost urlError={sp.error}>
        <main id="main" className="auth-page-inner">
          <AuthSignupCard
            oauthGoogleEnabled={oauthGoogleEnabled}
            oauthAppleEnabled={oauthAppleEnabled}
            initialEmail={initialEmail}
          />
        </main>

        <SiteLandingFooter />

        <FsScripts srcs={SIGNUP_SCRIPTS} />
      </AuthToastsHost>
    </div>
  );
}

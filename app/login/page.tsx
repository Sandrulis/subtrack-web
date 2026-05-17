import type { Metadata } from "next";
import { AuthLoginFlow } from "@/components/auth/auth-login-flow";
import { AuthToastsHost } from "@/components/auth-toasts-host";
import { FsScripts } from "@/components/fs/load-fs-scripts";
import { NavLanding } from "@/components/nav-landing";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";
import { getLoginSocialIntegrationFlags } from "@/lib/integrations/login-social-flags";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

const LOGIN_PAGE_SCRIPTS = ["/fs/js/signup.js"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.auth.login"),
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next =
    sp.next?.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/dashboard";

  const { googleEnabled: oauthGoogleEnabled, appleEnabled: oauthAppleEnabled } =
    await getLoginSocialIntegrationFlags();

  return (
    <div className="auth-page">
      <NavLanding active="login" />
      <AuthToastsHost urlError={sp.error} urlMessage={sp.message}>
        <div className="auth-page-inner">
          <AuthLoginFlow
            nextPath={next}
            oauthGoogleEnabled={oauthGoogleEnabled}
            oauthAppleEnabled={oauthAppleEnabled}
          />
        </div>

        <footer className="landing-footer">
          <SiteStandardCopyrightNotice />
        </footer>

        <FsScripts srcs={LOGIN_PAGE_SCRIPTS} />
      </AuthToastsHost>
    </div>
  );
}

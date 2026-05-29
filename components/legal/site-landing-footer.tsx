"use client";

import { AuthedFooterActionLinks } from "@/components/authed/authed-footer-action-links";
import { AuthedNavOverlaysProvider } from "@/components/authed/authed-nav-overlays-provider";
import { LegalFooterLinks } from "@/components/legal/legal-footer-links";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type SiteLandingFooterProps = {
  /** Sākumlapas papildu byline (© gads — zīmols — teksts). */
  byline?: boolean;
  /** Ielogotajiem: ieteikumi, atsauksmes, palīdzība (teksta saites). */
  showAuthedActionLinks?: boolean;
};

export function SiteLandingFooter({
  byline = false,
  showAuthedActionLinks = false,
}: SiteLandingFooterProps) {
  const year = new Date().getFullYear();
  const { systemSiteName, t } = useSubtrackIntl();

  const authedLinks = showAuthedActionLinks ? (
    <AuthedNavOverlaysProvider>
      <AuthedFooterActionLinks />
    </AuthedNavOverlaysProvider>
  ) : null;

  return (
    <footer className="landing-footer landing-footer--with-legal">
      {authedLinks}
      <LegalFooterLinks />
      {byline ? (
        <p className="landing-footer-byline">
          © {year} {systemSiteName} — {t("landing.footer.byline")}
        </p>
      ) : (
        <SiteStandardCopyrightNotice />
      )}
    </footer>
  );
}

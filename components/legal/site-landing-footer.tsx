"use client";

import { LegalFooterLinks } from "@/components/legal/legal-footer-links";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type SiteLandingFooterProps = {
  /** Sākumlapas papildu byline (© gads — zīmols — teksts). */
  byline?: boolean;
};

export function SiteLandingFooter({ byline = false }: SiteLandingFooterProps) {
  const year = new Date().getFullYear();
  const { systemSiteName, t } = useSubtrackIntl();

  return (
    <footer className="landing-footer landing-footer--with-legal">
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

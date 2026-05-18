"use client";

import Link from "next/link";
import { NavDash } from "@/components/nav-dash";
import { NavLanding } from "@/components/nav-landing";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  LEGAL_DOC_SECTIONS,
  legalDocTitleKey,
  legalDocUpdatedKey,
  type LegalDocId,
} from "@/lib/legal/legal-sections";

export function LegalDocumentPage({
  doc,
  userDisplay = null,
}: {
  doc: LegalDocId;
  userDisplay?: NavUserDisplay | null;
}) {
  const { t } = useSubtrackIntl();
  const sections = LEGAL_DOC_SECTIONS[doc];
  const authed = Boolean(userDisplay);

  return (
    <div className="auth-page legal-page">
      {authed ? (
        <NavDash active="" userDisplay={userDisplay} />
      ) : (
        <NavLanding active="" />
      )}
      <div className="auth-page-inner legal-page-inner">
        <article className="auth-card auth-card--legal legal-document">
          <p className="legal-document-back">
            <Link href={authed ? "/dashboard" : "/"}>
              {authed
                ? t("auth.change_password.back_dashboard")
                : t("legal.back_home")}
            </Link>
          </p>
          <h1>{t(legalDocTitleKey(doc))}</h1>
          <p className="legal-document-updated">{t(legalDocUpdatedKey(doc))}</p>
          <div className="legal-document-sections">
            {sections.map((section) => (
              <section key={section.titleKey} className="legal-document-section">
                <h2>{t(section.titleKey)}</h2>
                <p>{t(section.bodyKey)}</p>
              </section>
            ))}
          </div>
        </article>
      </div>
      <SiteLandingFooter />
    </div>
  );
}

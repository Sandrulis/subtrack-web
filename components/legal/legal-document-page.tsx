"use client";

import Link from "next/link";
import { NavLanding } from "@/components/nav-landing";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  LEGAL_DOC_SECTIONS,
  legalDocTitleKey,
  legalDocUpdatedKey,
  type LegalDocId,
} from "@/lib/legal/legal-sections";

export function LegalDocumentPage({ doc }: { doc: LegalDocId }) {
  const { t } = useSubtrackIntl();
  const sections = LEGAL_DOC_SECTIONS[doc];

  return (
    <div className="auth-page legal-page">
      <NavLanding active="" />
      <div className="auth-page-inner legal-page-inner">
        <article className="auth-card auth-card--legal legal-document">
          <p className="legal-document-back">
            <Link href="/">{t("legal.back_home")}</Link>
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

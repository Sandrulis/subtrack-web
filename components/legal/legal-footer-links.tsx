"use client";

import Link from "next/link";
import { dispatchOpenCookieSettings } from "@/lib/legal/cookie-consent";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

export function LegalFooterLinks() {
  const { t } = useSubtrackIntl();

  return (
    <nav className="legal-footer-links" aria-label={t("legal.footer.nav_aria")}>
      <Link href="/terms">{t("legal.footer.terms")}</Link>
      <span className="legal-footer-links-sep" aria-hidden="true">
        ·
      </span>
      <Link href="/privacy">{t("legal.footer.privacy")}</Link>
      <span className="legal-footer-links-sep" aria-hidden="true">
        ·
      </span>
      <Link href="/cookies">{t("legal.footer.cookies")}</Link>
      <span className="legal-footer-links-sep" aria-hidden="true">
        ·
      </span>
      <button
        type="button"
        className="legal-footer-links-btn"
        onClick={() => dispatchOpenCookieSettings()}
      >
        {t("legal.footer.cookie_settings")}
      </button>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { dispatchOpenCookieSettings } from "@/lib/legal/cookie-consent";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { useNativeCapacitorApp } from "@/lib/capacitor/use-native-capacitor-app";

export function LegalFooterLinks() {
  const { t, hasPublishedBlogPosts } = useSubtrackIntl();
  const isNativeApp = useNativeCapacitorApp();

  return (
    <nav className="legal-footer-links" aria-label={t("legal.footer.nav_aria")}>
      {hasPublishedBlogPosts ? (
        <>
          <Link href="/blog">{t("legal.footer.blog")}</Link>
          <span className="legal-footer-links-sep" aria-hidden="true">
            ·
          </span>
        </>
      ) : null}
      <Link href="/terms">{t("legal.footer.terms")}</Link>
      <span className="legal-footer-links-sep" aria-hidden="true">
        ·
      </span>
      <Link href="/privacy">{t("legal.footer.privacy")}</Link>
      <span className="legal-footer-links-sep" aria-hidden="true">
        ·
      </span>
      <Link href="/cookies">{t("legal.footer.cookies")}</Link>
      {isNativeApp ? null : (
        <>
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
        </>
      )}
    </nav>
  );
}

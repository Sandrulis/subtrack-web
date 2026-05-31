"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CookieSettingsModal } from "@/components/legal/cookie-settings-modal";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { useNativeCapacitorApp } from "@/lib/capacitor/use-native-capacitor-app";
import { ensureNativeCookieConsent } from "@/lib/capacitor/native-cookie-consent";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  readCookieConsentFromDocument,
  writeCookieConsent,
  type CookieConsentChoice,
} from "@/lib/legal/cookie-consent";

const DEFAULT_CHOICE: CookieConsentChoice = {
  functional: false,
  analytics: false,
};

export function CookieConsentRoot() {
  const isNativeApp = useNativeCapacitorApp();
  const { t } = useSubtrackIntl();
  const [bannerVisible, setBannerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<CookieConsentChoice>(DEFAULT_CHOICE);

  const syncFromCookie = useCallback(() => {
    const stored = readCookieConsentFromDocument();
    if (stored) {
      setDraft({ functional: stored.functional, analytics: stored.analytics });
      setBannerVisible(false);
    } else {
      setDraft(DEFAULT_CHOICE);
      setBannerVisible(true);
    }
  }, []);

  useEffect(() => {
    if (isNativeApp) {
      ensureNativeCookieConsent();
      return;
    }
    syncFromCookie();
  }, [syncFromCookie, isNativeApp]);

  useEffect(() => {
    if (isNativeApp) return;
    const onOpenSettings = () => {
      const stored = readCookieConsentFromDocument();
      setDraft(
        stored
          ? { functional: stored.functional, analytics: stored.analytics }
          : DEFAULT_CHOICE,
      );
      setModalOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
    return () =>
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings);
  }, [isNativeApp]);

  const applyChoice = useCallback((choice: CookieConsentChoice) => {
    writeCookieConsent(choice);
    setDraft(choice);
    setBannerVisible(false);
    setModalOpen(false);
  }, []);

  const openCustomize = useCallback(() => {
    const stored = readCookieConsentFromDocument();
    setDraft(
      stored
        ? { functional: stored.functional, analytics: stored.analytics }
        : DEFAULT_CHOICE,
    );
    setModalOpen(true);
  }, []);

  if (isNativeApp) {
    return null;
  }

  return (
    <>
      {bannerVisible ? (
        <div
          className="cookie-consent-banner"
          role="region"
          aria-label={t("legal.cookie.banner.aria")}
        >
          <div className="cookie-consent-banner-scrim" aria-hidden="true" />
          <div className="cookie-consent-banner-inner">
            <div className="cookie-consent-banner-main">
              <div className="cookie-consent-banner-icon" aria-hidden="true">
                <i className="fa-solid fa-cookie-bite" />
              </div>
              <div className="cookie-consent-banner-text">
                <p className="cookie-consent-banner-title">
                  {t("legal.cookie.banner.title")}
                </p>
                <p className="cookie-consent-banner-lead">
                  {t("legal.cookie.banner.lead")}{" "}
                  <Link href="/cookies">{t("legal.footer.cookies")}</Link>
                </p>
              </div>
            </div>
            <div className="cookie-consent-banner-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() =>
                  applyChoice({ functional: false, analytics: false })
                }
              >
                {t("legal.cookie.banner.reject_optional")}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={openCustomize}
              >
                {t("legal.cookie.banner.customize")}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  applyChoice({ functional: true, analytics: true })
                }
              >
                {t("legal.cookie.banner.accept_all")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <CookieSettingsModal
        open={modalOpen}
        initial={draft}
        onClose={() => setModalOpen(false)}
        onSave={applyChoice}
      />
    </>
  );
}

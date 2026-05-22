"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { CookieConsentChoice } from "@/lib/legal/cookie-consent";

type CookieSettingsModalProps = {
  open: boolean;
  initial: CookieConsentChoice;
  onClose: () => void;
  onSave: (choice: CookieConsentChoice) => void;
};

export function CookieSettingsModal({
  open,
  initial,
  onClose,
  onSave,
}: CookieSettingsModalProps) {
  const { t } = useSubtrackIntl();
  const titleId = useId();
  const [functional, setFunctional] = useState(initial.functional);
  const [analytics, setAnalytics] = useState(initial.analytics);

  useEffect(() => {
    if (open) {
      setFunctional(initial.functional);
      setAnalytics(initial.analytics);
    }
  }, [open, initial.functional, initial.analytics]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay cookie-consent-overlay open"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal cookie-consent-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <h2 id={titleId}>{t("legal.cookie.modal.title")}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label={t("legal.cookie.modal.close_aria")}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body cookie-consent-modal-body">
          <p className="cookie-consent-modal-lead">{t("legal.cookie.modal.lead")}</p>
          <ul className="cookie-consent-categories">
            <li className="cookie-consent-category cookie-consent-category--locked">
              <div className="cookie-consent-category-head">
                <h3>
                  <i
                    className="fa-solid fa-shield-halved cookie-consent-category-icon"
                    aria-hidden="true"
                  />
                  {t("legal.cookie.category.necessary.title")}
                </h3>
                <span className="cookie-consent-badge">
                  {t("legal.cookie.modal.always_on")}
                </span>
              </div>
              <p>{t("legal.cookie.category.necessary.desc")}</p>
            </li>
            <li className="cookie-consent-category">
              <div className="cookie-consent-category-head">
                <h3>
                  <i
                    className="fa-solid fa-language cookie-consent-category-icon"
                    aria-hidden="true"
                  />
                  {t("legal.cookie.category.functional.title")}
                </h3>
                <label className="cookie-consent-switch">
                  <input
                    type="checkbox"
                    checked={functional}
                    onChange={(e) => setFunctional(e.target.checked)}
                  />
                  <span className="cookie-consent-switch-ui" aria-hidden="true" />
                </label>
              </div>
              <p>{t("legal.cookie.category.functional.desc")}</p>
            </li>
            <li className="cookie-consent-category">
              <div className="cookie-consent-category-head">
                <h3>
                  <i
                    className="fa-solid fa-chart-line cookie-consent-category-icon"
                    aria-hidden="true"
                  />
                  {t("legal.cookie.category.analytics.title")}
                </h3>
                <label className="cookie-consent-switch">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />
                  <span className="cookie-consent-switch-ui" aria-hidden="true" />
                </label>
              </div>
              <p>{t("legal.cookie.category.analytics.desc")}</p>
            </li>
          </ul>
          <p className="cookie-consent-modal-more">
            <Link href="/cookies">{t("legal.cookie.modal.policy_link")}</Link>
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("legal.cookie.modal.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSave({ functional, analytics })}
          >
            {t("legal.cookie.modal.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

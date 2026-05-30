"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SessionBillingSummary } from "@/lib/billing/session-billing-summary";
import { getAdminUserPlanLabelKey } from "@/lib/admin/admin-user-plan-label";
import {
  formatDateForDisplayPreferences,
  type DisplayPreferences,
} from "@/lib/user-display-preferences";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { handleModalBackdropMouseDown } from "@/lib/ui/modal-overlay-guard";
import { pushDomToast } from "@/lib/push-dom-toast";

type BillingSubscriptionModalProps = {
  open: boolean;
  onClose: () => void;
  billing: SessionBillingSummary;
  displayPrefs: DisplayPreferences;
};

export function BillingSubscriptionModal({
  open,
  onClose,
  billing,
  displayPrefs,
}: BillingSubscriptionModalProps) {
  const { t, locale } = useSubtrackIntl();
  const titleId = useId();
  const subtitleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);

  const planLabelKey = getAdminUserPlanLabelKey({
    paidPlanActive: billing.paidPlanActive,
    proVip: billing.proVip,
    paidPlanType: billing.paidPlanType,
  });

  const planLabel = planLabelKey
    ? t(planLabelKey)
    : t("settings.billing.plan_unknown");

  const periodEndLabel = useMemo(() => {
    if (billing.paidPlanType === "lifetime") {
      return t("settings.billing.period_lifetime");
    }
    if (!billing.paidPlanPeriodEndAt) {
      return t("settings.billing.period_unknown");
    }
    try {
      return formatDateForDisplayPreferences(
        new Date(billing.paidPlanPeriodEndAt),
        displayPrefs,
        intlLocale,
      );
    } catch {
      return t("settings.billing.period_unknown");
    }
  }, [
    billing.paidPlanPeriodEndAt,
    billing.paidPlanType,
    displayPrefs,
    intlLocale,
    t,
  ]);

  const autoRenewLabel = useMemo(() => {
    if (billing.paidPlanType === "lifetime") {
      return t("settings.billing.auto_renew_na");
    }
    if (!billing.paidPlanActive) {
      return t("settings.billing.auto_renew_off");
    }
    return billing.paidPlanAutoRenew
      ? t("settings.billing.auto_renew_on")
      : t("settings.billing.auto_renew_off");
  }, [billing.paidPlanActive, billing.paidPlanAutoRenew, billing.paidPlanType, t]);

  const statusActive = billing.paidPlanActive;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    queueMicrotask(() => closeBtnRef.current?.focus());
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function openStripePortal() {
    if (portalBusy) return;
    setPortalBusy(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      let data: { success?: boolean; message?: string; url?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok || data.success !== true || !data.url) {
        pushDomToast(data.message ?? t("settings.billing.portal_error"), "error");
        return;
      }
      onClose();
      window.location.href = data.url;
    } catch {
      pushDomToast(t("settings.billing.portal_error"), "error");
    } finally {
      setPortalBusy(false);
    }
  }

  if (!open || !portalTarget) return null;

  const showPortal = !billing.proVip && Boolean(billing.stripeCustomerId);

  const overlay = (
    <div
      className="modal-overlay billing-subscription-overlay open"
      role="presentation"
      onMouseDown={(e) =>
        handleModalBackdropMouseDown(e, onClose, {
          busy: portalBusy,
          confirmMessage: t("ui.modal.confirm_close_backdrop"),
        })
      }
    >
      <div
        className="modal billing-subscription-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header billing-subscription-modal-header">
          <div className="billing-subscription-modal-head-main">
            <span className="billing-subscription-modal-head-icon" aria-hidden="true">
              <i className="fa-solid fa-crown" />
            </span>
            <div>
              <h2 id={titleId}>{t("settings.billing.modal_title")}</h2>
              <p className="billing-subscription-modal-subtitle" id={subtitleId}>
                {planLabel}
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-close"
            aria-label={t("settings.billing.modal_close")}
            disabled={portalBusy}
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body billing-subscription-modal-body">
          {billing.proVip ? (
            <div className="billing-subscription-callout billing-subscription-callout--vip">
              <p>{t("settings.billing.vip_lead")}</p>
            </div>
          ) : billing.proTrialActive && !billing.paidPlanActive ? (
            <div className="billing-subscription-callout billing-subscription-callout--trial">
              <p>{t("settings.billing.trial_lead")}</p>
              <Link href="/subscribe" className="btn btn-primary" onClick={onClose}>
                {t("settings.billing.trial_cta")}
              </Link>
            </div>
          ) : (
            <>
              <div className="billing-subscription-grid">
                <div className="billing-subscription-tile">
                  <span className="billing-subscription-tile-label">
                    {t("settings.billing.field_plan")}
                  </span>
                  <span className="billing-subscription-tile-value">{planLabel}</span>
                </div>
                <div className="billing-subscription-tile">
                  <span className="billing-subscription-tile-label">
                    {t("settings.billing.field_status")}
                  </span>
                  <span
                    className={
                      "billing-subscription-status-pill" +
                      (statusActive
                        ? " billing-subscription-status-pill--active"
                        : " billing-subscription-status-pill--inactive")
                    }
                  >
                    {statusActive
                      ? t("settings.billing.status_active")
                      : t("settings.billing.status_inactive")}
                  </span>
                </div>
                <div className="billing-subscription-tile">
                  <span className="billing-subscription-tile-label">
                    {t("settings.billing.field_period_end")}
                  </span>
                  <span className="billing-subscription-tile-value billing-subscription-tile-value--emphasis">
                    {periodEndLabel}
                  </span>
                </div>
                <div className="billing-subscription-tile">
                  <span className="billing-subscription-tile-label">
                    {t("settings.billing.field_auto_renew")}
                  </span>
                  <span className="billing-subscription-tile-value">{autoRenewLabel}</span>
                </div>
              </div>
              <p className="form-hint billing-subscription-hint">
                {t("settings.billing.portal_hint")}
              </p>
              {showPortal && billing.paidPlanType !== "lifetime" ? (
                <p className="billing-subscription-info-hint">
                  <i className="fas fa-info-circle" aria-hidden="true" />
                  <span>{t("settings.billing.portal_auto_renew_hint")}</span>
                </p>
              ) : null}
            </>
          )}
        </div>
        <div className="modal-footer billing-subscription-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={portalBusy}
            onClick={onClose}
          >
            {t("settings.billing.modal_close")}
          </button>
          {showPortal ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={portalBusy}
              aria-busy={portalBusy}
              onClick={() => {
                void openStripePortal();
              }}
            >
              {t("settings.billing.portal_open")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, portalTarget);
}

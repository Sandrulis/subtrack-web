"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { BillingCurrency } from "@/lib/billing/billing-currency";
import { createBillingAmountFormatter } from "@/lib/billing/format-billing-amount";
import type { ProTrackPlan } from "@/lib/billing/pro-track-subscription";
import { pushDomToast } from "@/lib/push-dom-toast";

type SubscribeProTrackPromptProps = {
  plan: ProTrackPlan;
  amountEur: number;
  currency: BillingCurrency;
};

export function SubscribeProTrackPrompt({
  plan,
  amountEur,
  currency,
}: SubscribeProTrackPromptProps) {
  const { t, locale } = useSubtrackIntl();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);

  const priceFmt = useMemo(
    () => createBillingAmountFormatter(locale, currency)(amountEur),
    [locale, currency, amountEur],
  );

  const bodyKey =
    plan === "annual"
      ? "subscribe.success.track_prompt.body_annual"
      : "subscribe.success.track_prompt.body_monthly";

  const body = t(bodyKey).replace(/\{price\}/g, priceFmt);

  async function goDashboard() {
    await router.refresh();
    router.push("/dashboard");
  }

  function dismiss() {
    setOpen(false);
    void goDashboard();
  }

  async function confirmAdd() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/billing/pro-track-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (res.ok && data.success === true) {
        pushDomToast(t("subscribe.success.track_prompt.success"), "success");
        setOpen(false);
        void goDashboard();
        return;
      }
      pushDomToast(
        data.message ?? t("subscribe.success.track_prompt.error"),
        "error",
      );
    } catch {
      pushDomToast(t("subscribe.success.track_prompt.error"), "error");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="modal-overlay open modal-backdrop-close-confirm-overlay subscribe-pro-track-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) dismiss();
      }}
    >
      <div
        className="modal modal-backdrop-close-confirm subscribe-pro-track-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="subscribe-pro-track-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <div className="modal-backdrop-close-confirm-icon" aria-hidden="true">
            <i className="fa-solid fa-calendar-plus" />
          </div>
          <h3 id="subscribe-pro-track-title">
            {t("subscribe.success.track_prompt.title")}
          </h3>
          <p>{body}</p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={dismiss}
          >
            {t("subscribe.success.track_prompt.btn_no")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            aria-busy={busy}
            onClick={() => void confirmAdd()}
          >
            {t("subscribe.success.track_prompt.btn_yes")}
          </button>
        </div>
      </div>
    </div>
  );
}

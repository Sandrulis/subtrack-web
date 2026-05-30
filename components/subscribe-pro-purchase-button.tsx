"use client";

import { useState } from "react";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import type { SubscribePlanType } from "@/lib/billing/subscribe-plan-type";

/** Redzamais teksts – konteksts (cena, periods) jau ir kartē virs pogas. */
const PURCHASE_ARIA_KEY: Record<SubscribePlanType, string> = {
  monthly: "subscribe.purchase.aria_monthly",
  annual: "subscribe.purchase.aria_annual",
  lifetime: "subscribe.purchase.aria_lifetime",
};

export function SubscribeProPurchaseButton({ plan }: { plan: SubscribePlanType }) {
  const { t } = useSubtrackIntl();
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        url?: string;
        message?: string;
      };
      if (res.ok && data.success === true && typeof data.url === "string" && data.url) {
        window.location.assign(data.url);
        return;
      }
      pushDomToast(data.message ?? t("subscribe.checkout.error"), "error");
    } catch {
      pushDomToast(t("subscribe.checkout.error"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-primary subscribe-pro-purchase-btn"
      disabled={loading}
      aria-label={t(PURCHASE_ARIA_KEY[plan])}
      onClick={() => void handlePurchase()}
    >
      {loading ? (
        <>
          <i className="fa-solid fa-circle-notch fa-spin btn-spinner" aria-hidden="true" />{" "}
          {t("subscribe.checkout.loading")}
        </>
      ) : (
        t("subscribe.purchase")
      )}
    </button>
  );
}

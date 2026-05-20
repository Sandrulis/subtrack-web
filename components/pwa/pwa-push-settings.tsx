"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import {
  hasActivePushSubscription,
  isPushSupportedInBrowser,
  subscribeToPaymentPush,
  unsubscribeFromPaymentPush,
} from "@/lib/push/push-client";
import { useCallback, useEffect, useState } from "react";

export function PwaPushSettings() {
  const { t, pwa } = useSubtrackIntl();
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const sup = isPushSupportedInBrowser();
    setSupported(sup);
    if (!sup) {
      setPermission("unsupported");
      setSubscribed(false);
      return;
    }
    setPermission(Notification.permission);
    setSubscribed(await hasActivePushSubscription());
  }, []);

  useEffect(() => {
    setMounted(true);
    void refresh();
  }, [refresh]);

  if (!pwa.enabled) return null;

  const vapidOk = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());
  const showActions = mounted;

  async function onEnable() {
    setBusy(true);
    const res = await subscribeToPaymentPush();
    setBusy(false);
    if (res.ok) {
      pushDomToast(t("settings.push.toast_enabled"), "success");
      await refresh();
      return;
    }
    if (res.reason === "denied") {
      pushDomToast(t("settings.push.denied"), "error");
    } else if (res.reason === "vapid") {
      pushDomToast(t("settings.push.err_vapid"), "error");
    } else if (res.reason === "unsupported") {
      pushDomToast(t("settings.push.unsupported"), "error");
    } else {
      pushDomToast(res.message ?? t("settings.push.unsupported"), "error");
    }
    await refresh();
  }

  async function onDisable() {
    setBusy(true);
    await unsubscribeFromPaymentPush();
    setBusy(false);
    pushDomToast(t("settings.push.toast_disabled"), "info");
    await refresh();
  }

  return (
    <section className="settings-pwa-push" aria-labelledby="settings-pwa-push-heading">
      <h2 id="settings-pwa-push-heading" className="settings-section-title">
        {t("settings.push.section_title")}
      </h2>
      <p className="settings-pwa-push-hint">{t("settings.push.lead")}</p>

      {!showActions ? null : !supported ? (
        <p className="settings-pwa-push-status">{t("settings.push.unsupported")}</p>
      ) : !vapidOk ? (
        <p className="settings-pwa-push-status">{t("settings.push.err_vapid")}</p>
      ) : permission === "denied" ? (
        <p className="settings-pwa-push-status">{t("settings.push.denied")}</p>
      ) : subscribed ? (
        <>
          <p className="settings-pwa-push-status settings-pwa-push-status--ok">
            {t("settings.push.enabled")}
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy}
            onClick={() => void onDisable()}
          >
            {t("settings.push.disable")}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={() => void onEnable()}
        >
          {t("settings.push.enable")}
        </button>
      )}
    </section>
  );
}

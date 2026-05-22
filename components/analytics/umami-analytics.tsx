"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { getUmamiWebsiteId, UMAMI_SCRIPT_SRC } from "@/lib/analytics/umami";
import {
  canUseAnalyticsCookies,
  COOKIE_CONSENT_CHANGED_EVENT,
  hasCookieConsentChoice,
} from "@/lib/legal/cookie-consent";

function shouldLoadUmami(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (!getUmamiWebsiteId()) return false;
  if (!hasCookieConsentChoice()) return false;
  return canUseAnalyticsCookies();
}

export function UmamiAnalytics() {
  const websiteId = getUmamiWebsiteId();
  const [enabled, setEnabled] = useState(false);

  const sync = useCallback(() => {
    setEnabled(shouldLoadUmami());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
  }, [sync]);

  if (!enabled || !websiteId) return null;

  return (
    <Script
      defer
      src={UMAMI_SCRIPT_SRC}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

type LandingPricingLifetimeUrgencyProps = {
  endsAt: string | null;
  initialRemainingMs: number | null;
  purchasesRemaining: number | null;
  countdownLabel: string;
  daysLabel: string;
  hoursLabel: string;
  minutesLabel: string;
  secondsLabel: string;
  purchasesLabel: string;
  /** `landing` = sākumlapa; `subscribe` = /subscribe */
  scope?: "landing" | "subscribe";
};

function scopePrefix(scope: "landing" | "subscribe"): string {
  return scope === "subscribe" ? "subscribe-pro-lifetime" : "landing-pricing-lifetime";
}

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function splitRemainingMs(ms: number): CountdownParts {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

function CountdownUnit({
  value,
  label,
  scope,
}: {
  value: number;
  label: string;
  scope: "landing" | "subscribe";
}) {
  const p = scopePrefix(scope);
  return (
    <span className={`${p}-unit`}>
      <span className={`${p}-unit-value`}>{String(value).padStart(2, "0")}</span>
      <span className={`${p}-unit-label`}>{label}</span>
    </span>
  );
}

export function LandingPricingLifetimeUrgency({
  endsAt,
  initialRemainingMs,
  purchasesRemaining,
  countdownLabel,
  daysLabel,
  hoursLabel,
  minutesLabel,
  secondsLabel,
  purchasesLabel,
  scope = "landing",
}: LandingPricingLifetimeUrgencyProps) {
  const p = scopePrefix(scope);
  const endsMs = useMemo(() => (endsAt ? Date.parse(endsAt) : NaN), [endsAt]);
  const [remainingMs, setRemainingMs] = useState(initialRemainingMs);

  useEffect(() => {
    if (!Number.isFinite(endsMs)) return;
    const tick = () => {
      const next = endsMs - Date.now();
      setRemainingMs(next > 0 ? next : 0);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsMs]);

  const showCountdown =
    Number.isFinite(endsMs) && remainingMs != null && remainingMs > 0;
  const showPurchases = purchasesRemaining != null && purchasesRemaining > 0;

  if (!showCountdown && !showPurchases) {
    return null;
  }

  const parts =
    showCountdown && remainingMs != null ? splitRemainingMs(remainingMs) : null;

  return (
    <div className={`${p}-urgency`}>
      {showCountdown && parts ? (
        <div className={`${p}-countdown-box`}>
          <p className={`${p}-urgency-label`}>{countdownLabel}</p>
          <div className={`${p}-countdown-units`} aria-live="polite">
            {parts.days > 0 ? (
              <CountdownUnit value={parts.days} label={daysLabel} scope={scope} />
            ) : null}
            <CountdownUnit value={parts.hours} label={hoursLabel} scope={scope} />
            <CountdownUnit value={parts.minutes} label={minutesLabel} scope={scope} />
            <CountdownUnit value={parts.seconds} label={secondsLabel} scope={scope} />
          </div>
        </div>
      ) : null}
      {showPurchases ? (
        <p className={`${p}-purchases`}>
          <span className={`${p}-purchases-dot`} aria-hidden />
          {purchasesLabel.replace(/\{count\}/g, String(purchasesRemaining))}
        </p>
      ) : null}
    </div>
  );
}

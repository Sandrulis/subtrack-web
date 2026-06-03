"use client";

import Image from "next/image";
import Link from "next/link";
import { NavDash } from "@/components/nav-dash";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { buildPaidPlanAnnualPitchCopy } from "@/lib/paid-plan-annual";
import { LandingPricingLifetimeUrgency } from "@/components/landing-pricing-lifetime-urgency";
import { SubscribeProPurchaseButton } from "@/components/subscribe-pro-purchase-button";
import { createBillingAmountFormatter } from "@/lib/billing/format-billing-amount";
import type { BillingCurrency } from "@/lib/billing/billing-currency";
import { useMemo } from "react";

const PRO_BENEFIT_ICONS = [
  "fa-solid fa-infinity",
  "fa-solid fa-calendar-days",
  "fa-solid fa-chart-line",
] as const;

export function SubscribeProView({
  userDisplay,
  priceEur,
  freeTierLimit,
  annualPriceEur = null,
  lifetime = null,
  billingCurrency = "EUR",
}: {
  userDisplay?: NavUserDisplay | null;
  priceEur: number;
  freeTierLimit: number;
  annualPriceEur?: number | null;
  lifetime?: {
    priceEur: number;
    endsAt: string | null;
    remainingMs: number | null;
    purchasesRemaining: number | null;
  } | null;
  billingCurrency?: BillingCurrency;
}) {
  const { t, locale } = useSubtrackIntl();
  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);

  const fmtPrice = useMemo(
    () => createBillingAmountFormatter(intlLocale, billingCurrency),
    [billingCurrency, intlLocale],
  );

  const priceFmt = useMemo(() => fmtPrice(priceEur), [fmtPrice, priceEur]);

  const annualPitch = useMemo(
    () =>
      buildPaidPlanAnnualPitchCopy(priceEur, annualPriceEur, fmtPrice, t, {
        line: "landing.pricing.annual_line",
        discount: "landing.pricing.annual_discount",
        equiv: "landing.pricing.annual_equiv",
      }),
    [annualPriceEur, fmtPrice, priceEur, t],
  );

  const lifetimePriceFmt = useMemo(
    () => (lifetime ? fmtPrice(lifetime.priceEur) : ""),
    [fmtPrice, lifetime],
  );

  const benefitIds = ["unlimited", "calendar", "analytics"] as const;

  return (
    <div className="app-layout app-layout-stacked">
      <NavDash active="" userDisplay={userDisplay} />
      <main className="main-content subscribe-pro-main">
        <Link
          href="/dashboard"
          className="subscribe-pro-back"
        >
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />{" "}
          {t("subscribe.nav.back")}
        </Link>

        <section className="subscribe-pro-hero">
          <div className="subscribe-pro-hero-grid">
            <div className="subscribe-pro-hero-text">
              <div className="subscribe-pro-badge">
                <i className="fa-solid fa-crown" aria-hidden="true" /> Pro
              </div>
              <h1 className="subscribe-pro-title">{t("subscribe.hero.title")}</h1>
              <p className="subscribe-pro-lead">{t("subscribe.hero.lead")}</p>
              <div className="subscribe-pro-free-note">
                {t("subscribe.free_tier.note")
                  .replace(/\{price\}/g, priceFmt)
                  .replace(/\{n\}/g, String(freeTierLimit))}
              </div>
            </div>
            <div className="subscribe-pro-hero-visual">
              <Image
                src="/landing-coffee.svg"
                alt={t("subscribe.coffee.alt")}
                width={140}
                height={140}
                className="subscribe-pro-coffee-img"
              />
            </div>
          </div>
        </section>

        <div className="subscribe-pro-plans-stack">
          {annualPitch ? (
            <div className="subscribe-pro-pricing-highlight">
              <div className="subscribe-pro-pricing-monthly-pill">
                <div className="subscribe-pro-pricing-card-body subscribe-pro-pricing-card-body--monthly">
                  <div className="subscribe-pro-pricing-monthly-head">
                    <span className="subscribe-pro-pricing-monthly-value">{priceFmt}</span>
                    <span className="subscribe-pro-pricing-monthly-period">
                      {t("landing.pricing.monthly_suffix")}
                    </span>
                  </div>
                </div>
                <SubscribeProPurchaseButton plan="monthly" />
              </div>
              <div className="subscribe-pro-pricing-annual-card">
                <div className="subscribe-pro-pricing-card-body">
                  <div className="subscribe-pro-pricing-annual-row">
                    <span className="subscribe-pro-pricing-annual-label">
                      {t("landing.pricing.annual_label")}
                    </span>
                    <span className="subscribe-pro-pricing-annual-amount">
                      {annualPitch.annualFormatted}
                    </span>
                    {annualPitch.discountPercent != null ? (
                      <span className="subscribe-pro-pricing-annual-badge">
                        {t("landing.pricing.annual_badge_off").replace(
                          /\{discount\}/g,
                          String(annualPitch.discountPercent),
                        )}
                      </span>
                    ) : null}
                  </div>
                  <p className="subscribe-pro-pricing-annual-equiv">{annualPitch.equiv}</p>
                </div>
                <SubscribeProPurchaseButton plan="annual" />
              </div>
            </div>
          ) : (
            <div className="subscribe-pro-price-card">
              <p className="subscribe-pro-price-label">{t("subscribe.price.title")}</p>
              <p className="subscribe-pro-price-value">{priceFmt}</p>
              <p className="subscribe-pro-price-interval">{t("subscribe.price.interval")}</p>
              <SubscribeProPurchaseButton plan="monthly" />
            </div>
          )}

          {lifetime ? (
            <div className="subscribe-pro-lifetime-card">
              <div className="subscribe-pro-lifetime-body">
                <div className="subscribe-pro-lifetime-main">
                  <div className="subscribe-pro-lifetime-row">
                    <span className="subscribe-pro-lifetime-label">
                      {t("landing.pricing.lifetime_label")}
                    </span>
                    <span className="subscribe-pro-lifetime-amount">{lifetimePriceFmt}</span>
                    <span className="subscribe-pro-lifetime-badge">
                      {t("landing.pricing.lifetime_badge")}
                    </span>
                  </div>
                  <p className="subscribe-pro-lifetime-tagline">
                    {t("landing.pricing.lifetime_tagline")}
                  </p>
                  <p className="subscribe-pro-lifetime-interval">
                    {t("subscribe.price.lifetime_interval")}
                  </p>
                </div>
                <LandingPricingLifetimeUrgency
                  scope="subscribe"
                  endsAt={lifetime.endsAt}
                  initialRemainingMs={lifetime.remainingMs}
                  purchasesRemaining={lifetime.purchasesRemaining}
                  countdownLabel={t("landing.pricing.lifetime_countdown_label")}
                  daysLabel={t("landing.pricing.lifetime_countdown_days")}
                  hoursLabel={t("landing.pricing.lifetime_countdown_hours")}
                  minutesLabel={t("landing.pricing.lifetime_countdown_minutes")}
                  secondsLabel={t("landing.pricing.lifetime_countdown_seconds")}
                  purchasesLabel={t("landing.pricing.lifetime_purchases_remaining")}
                />
                <SubscribeProPurchaseButton plan="lifetime" />
              </div>
            </div>
          ) : null}
        </div>

        <section className="subscribe-pro-benefits">
          <h2 className="subscribe-pro-section-heading">{t("subscribe.benefits.title")}</h2>
          <div className="subscribe-pro-benefits-grid">
            {benefitIds.map((id, idx) => (
              <div key={id} className="subscribe-pro-benefit-card">
                <div className="subscribe-pro-benefit-icon">
                  <i className={PRO_BENEFIT_ICONS[idx]} aria-hidden="true" />
                </div>
                <h3>{t(`subscribe.benefit.${id}.title`)}</h3>
                <p>{t(`subscribe.benefit.${id}.text`)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteLandingFooter />
      <div className="toast-container" id="toast-container" />
    </div>
  );
}

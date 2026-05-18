"use client";

import Image from "next/image";
import Link from "next/link";
import { NavDash } from "@/components/nav-dash";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
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
}: {
  userDisplay?: NavUserDisplay | null;
  priceEur: number;
  freeTierLimit: number;
}) {
  const { t, locale } = useSubtrackIntl();
  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);

  const priceFmt = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: "EUR",
      }).format(Number.isFinite(priceEur) ? priceEur : 0),
    [intlLocale, priceEur],
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

        <div className="subscribe-pro-price-card">
          <p className="subscribe-pro-price-label">{t("subscribe.price.title")}</p>
          <p className="subscribe-pro-price-value">{priceFmt}</p>
          <p className="subscribe-pro-price-interval">{t("subscribe.price.interval")}</p>
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
    </div>
  );
}

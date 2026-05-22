import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import { calendarWeekdayHeadersForIntl } from "@/lib/calendar-weekday-headers";
import { getLandingUiPhrases } from "@/lib/landing/get-landing-ui-phrases";
import { getPublicSystemSettings } from "@/lib/system-settings-public";
import { resolveRequestUiLocales } from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

const HM_Y = 2026;
const HM_M = 5;
const HM_DEMO_TODAY = 16;

/** Hero kalendāra parauga dienas (2026. gada maijs). */
const HM_DAYS: Record<number, { classes: string[]; paidMark?: boolean }> = {
  8: { classes: ["pay-cal-cell--due", "pay-cal-cell--overdue"] },
  10: { classes: ["pay-cal-cell--paid-past"], paidMark: true },
  13: { classes: ["pay-cal-cell--paid-past"], paidMark: true },
  15: { classes: ["pay-cal-cell--due"] },
  18: { classes: ["pay-cal-cell--due"] },
  24: { classes: ["pay-cal-cell--due"] },
};

function heroCalCellSpec(day: number): { cls: string; paidMark: boolean } {
  const spec = HM_DAYS[day];
  const parts = ["pay-cal-cell", ...(spec?.classes ?? [])];
  if (
    day === HM_DEMO_TODAY &&
    !parts.includes("pay-cal-cell--overdue")
  ) {
    parts.push("pay-cal-cell--today");
  }
  return {
    cls: parts.join(" "),
    paidMark: spec?.paidMark === true,
  };
}

function heroCalendarWeekdays(intlLocale: string): string[] {
  return calendarWeekdayHeadersForIntl(intlLocale);
}

function heroCalendarMonthTitle(intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(HM_Y, HM_M - 1, 1));
}

export function LandingHeroCalendarMock({
  intlLocale,
  legendDue,
  legendOverdue,
  legendPaid,
}: {
  intlLocale: string;
  legendDue: string;
  legendOverdue: string;
  legendPaid: string;
}) {
  const first = new Date(HM_Y, HM_M - 1, 1);
  const hmPad = (first.getDay() + 6) % 7;
  const hmDim = new Date(HM_Y, HM_M, 0).getDate();
  const weekdays = heroCalendarWeekdays(intlLocale);
  const title = heroCalendarMonthTitle(intlLocale);

  const cells: ReactNode[] = [];
  for (let i = 0; i < hmPad; i++) {
    cells.push(
      <div
        key={`pad-${i}`}
        className="pay-cal-cell pay-cal-cell--empty"
        aria-hidden="true"
      />,
    );
  }
  for (let d = 1; d <= hmDim; d++) {
    const { cls, paidMark } = heroCalCellSpec(d);
    cells.push(
      <div key={d} className={cls}>
        {d}
        {paidMark ? (
          <span className="pay-cal-cell-paid-flag" aria-hidden="true">
            <i className="fa-solid fa-check" />
          </span>
        ) : null}
      </div>,
    );
  }

  return (
    <div className="dashboard-top-calendar">
      <div className="pay-calendar-card">
        <div className="pay-calendar-toolbar landing-hero-cal-toolbar">
          <span className="pay-cal-nav landing-hero-cal-nav-faux" tabIndex={-1}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </span>
          <div className="pay-calendar-title landing-hero-cal-title">{title}</div>
          <span className="pay-cal-nav landing-hero-cal-nav-faux" tabIndex={-1}>
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </span>
        </div>
        <div className="pay-calendar landing-hero-cal-body">
          <div className="pay-cal-weekdays">
            {weekdays.map((wd, idx) => (
              <span key={`${HM_M}-${HM_Y}-${idx}-${wd}`} className="pay-cal-wd">
                {wd}
              </span>
            ))}
          </div>
          <div className="pay-cal-grid landing-hero-cal-grid">{cells}</div>
        </div>
        <p className="pay-calendar-hint landing-hero-cal-hint">
          <span className="pay-cal-legend-i pay-cal-legend-i--due" aria-hidden="true" />
          {legendDue}
          <span className="pay-calendar-hint-sep" aria-hidden="true">
            ·
          </span>
          <span
            className="pay-cal-legend-i pay-cal-legend-i--overdue"
            aria-hidden="true"
          />
          {legendOverdue}
          <span className="pay-calendar-hint-sep" aria-hidden="true">
            ·
          </span>
          <span
            className="pay-cal-legend-i pay-cal-legend-i--paid-past"
            aria-hidden="true"
          />
          {legendPaid}
        </p>
      </div>
    </div>
  );
}

export function LandingHeroDashboardMock({
  intlLocale,
  t,
  demoMode = false,
  paidPlanEnabled = false,
}: {
  intlLocale: string;
  t: (key: string) => string;
  /** Publiskajai /demo/dashboard: redzams ekrāna lasītājiem un paraugu „Labot” pogas. */
  demoMode?: boolean;
  /** Ja maksas plāns ieslēgts: piezīme zem kalendāra par ilustratīvo saturu. */
  paidPlanEnabled?: boolean;
}) {
  const df = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
  });

  const d10 = df.format(new Date(HM_Y, HM_M - 1, 10));
  const d15 = df.format(new Date(HM_Y, HM_M - 1, 15));
  const d18 = df.format(new Date(HM_Y, HM_M - 1, 18));

  return (
    <div
      className="landing-hero-dashboard-mock"
      aria-hidden={demoMode ? undefined : true}
    >
      <div className="dashboard-overview-main">
        <div className="dashboard-overview-calendar-col">
          <LandingHeroCalendarMock
            intlLocale={intlLocale}
            legendDue={t("landing.mock.legend_due")}
            legendOverdue={t("landing.mock.legend_overdue")}
            legendPaid={t("fs.dashboard.legend_paid_marked")}
          />
          {paidPlanEnabled ? (
            <p className="landing-hero-calendar-paid-note" role="note">
              <i className="fa-solid fa-circle-info" aria-hidden="true" />
              {t("landing.hero.calendar_mock_paid_note")}
            </p>
          ) : null}
        </div>

        <div className="dashboard-overview-right-col">
          <div className="dashboard-overview-stats-row landing-hero-mock-stats">
            <div className="stat-card">
              <div className="stat-label">{t("landing.mock.stat_total_label")}</div>
              <div className="stat-value">€184.35</div>
              <div className="stat-note">{t("landing.mock.stat_total_note")}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t("landing.mock.stat_active_label")}</div>
              <div className="stat-value">8</div>
              <div className="stat-note">{t("landing.mock.stat_active_note")}</div>
            </div>
          </div>

          <div className="dashboard-overview-next-slot dashboard-next-pay-slot">
            <div className="stat-card stat-card--next-pay">
              <div className="stat-label">{t("landing.mock.next_pay_label")}</div>
              <div className="stat-next-body">
                <div className="stat-next-text">
                  <div className="stat-value stat-value--next">{d18}</div>
                  <div className="stat-next-name">{t("landing.mock.sample_bill_name")}</div>
                </div>
                <div className="stat-next-amount">€30.50</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-header landing-hero-mock-section-h">
        <h3 className="section-heading">{t("landing.mock.subscription_list_heading")}</h3>
      </div>

      <div className="sub-list landing-hero-mock-subs">
        <div className="sub-item">
          <div className="sub-item-top">
            <div className="sub-icon-col">
              <span className="sub-icon-bg">
                <i className="fa-solid fa-music" style={{ color: "#1DB954" }} />
              </span>
            </div>
            <div className="sub-main">
              <div className="sub-info">
                <div className="sub-name-row">
                  <span className="sub-name">Spotify</span>
                  <span className="sub-category-pill">{t("landing.mock.pill_subscription")}</span>
                </div>
                <div className="sub-date soon">
                  <i className="fa-solid fa-hourglass-half" />
                  <span>
                    {t("landing.mock.pay_line")}
                    {d10}
                  </span>
                </div>
              </div>
              <div className="sub-right">
                <div className="sub-amount-wrap">
                  <div className="sub-amount">€9.99</div>
                  <div className="sub-period">{t("landing.mock.period_month")}</div>
                </div>
                {demoMode ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline demo-sub-edit-btn"
                    title={t("demo.edit_hint")}
                  >
                    {t("demo.action.edit_sample")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="sub-item">
          <div className="sub-item-top">
            <div className="sub-icon-col">
              <span className="sub-icon-bg">
                <i className="fa-solid fa-film" style={{ color: "#E50914" }} />
              </span>
            </div>
            <div className="sub-main">
              <div className="sub-info">
                <div className="sub-name-row">
                  <span className="sub-name">Netflix</span>
                  <span className="sub-category-pill">{t("landing.mock.pill_subscription")}</span>
                </div>
                <div className="sub-date">
                  <i className="fa-regular fa-calendar" />
                  <span>
                    {t("landing.mock.pay_line")}
                    {d15}
                  </span>
                </div>
              </div>
              <div className="sub-right">
                <div className="sub-amount-wrap">
                  <div className="sub-amount">€10.99</div>
                  <div className="sub-period">{t("landing.mock.period_month")}</div>
                </div>
                {demoMode ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline demo-sub-edit-btn"
                    title={t("demo.edit_hint")}
                  >
                    {t("demo.action.edit_sample")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="sub-item">
          <div className="sub-item-top">
            <div className="sub-icon-col">
              <span className="sub-icon-bg">
                <i
                  className="fa-solid fa-mobile-screen-button"
                  style={{ color: "#0ea5e9" }}
                />
              </span>
            </div>
            <div className="sub-main">
              <div className="sub-info">
                <div className="sub-name-row">
                  <span className="sub-name">{t("landing.mock.sample_bill_name")}</span>
                  <span className="sub-category-pill">{t("landing.mock.pill_bill")}</span>
                </div>
                <div className="sub-date">
                  <i className="fa-regular fa-calendar" />
                  <span>
                    {t("landing.mock.pay_line")}
                    {d18}
                  </span>
                </div>
              </div>
              <div className="sub-right">
                <div className="sub-amount-wrap">
                  <div className="sub-amount">€30.50</div>
                  <div className="sub-period">{t("landing.mock.period_month")}</div>
                </div>
                {demoMode ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline demo-sub-edit-btn"
                    title={t("demo.edit_hint")}
                  >
                    {t("demo.action.edit_sample")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="sub-term-block">
            <div className="sub-term-header">
              <div className="sub-term-label">
                <i className="fa-solid fa-hourglass-half" />
                {t("landing.mock.term_label")}15.06.2024 - 15.06.2027
                <span className="sub-term-atlikums">{t("landing.mock.term_left_demo")}</span>
              </div>
              <span className="sub-term-pct">
                <strong>48</strong> {t("landing.mock.term_pct_demo")}
              </span>
            </div>
            <div className="sub-term-bar-track">
              <div
                className="sub-term-bar-fill"
                style={{ width: "48%", background: "#0ea5e9" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURE_ROWS = [
  { icon: "fa-solid fa-calendar-days", id: "never_miss" as const },
  { icon: "fa-solid fa-chart-pie", id: "spendviz" as const },
  { icon: "fa-solid fa-bell", id: "reminders" as const },
  { icon: "fa-solid fa-tags", id: "categories" as const },
  { icon: "fa-solid fa-chart-column", id: "analytics" as const },
  { icon: "fa-solid fa-pen-to-square", id: "management" as const },
] as const;

function buildLandingPhraseLookup(
  phrases: Record<string, string>,
): (key: string) => string {
  return (key: string) => {
    const v = phrases[key];
    return typeof v === "string" && v.length > 0 ? v : key;
  };
}

export async function LandingPageContent() {
  const [{ locale }, { paidPlan }, phrases] = await Promise.all([
    resolveRequestUiLocales(),
    getPublicSystemSettings(),
    getLandingUiPhrases(),
  ]);
  const t = buildLandingPhraseLookup(phrases);
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);

  let paidPitch: { blurb: string } | null = null;
  if (paidPlan?.enabled) {
    const price = new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: "EUR",
    }).format(paidPlan.priceEur);
    const blurb = t("landing.pricing.blurb")
      .replace(/\{count\}/g, String(paidPlan.freeSubscriptionLimit))
      .replace(/\{price\}/g, price);
    paidPitch = { blurb };
  }

  return (
    <>
      <section className="landing-hero-section">
        <div className="landing-hero-grid">
          <div className="landing-hero-text">
            <div className="hero-badge">
              <i className="fa-solid fa-bolt" />
              {t("landing.hero.badge")}
            </div>
            <h1 className="hero-title">
              {t("landing.hero.title_line1")}
              <br />
              {t("landing.hero.title_line2")}
              <span>{t("landing.hero.title_emphasis")}</span>
            </h1>
            <p className="hero-subtitle">{t("landing.hero.subtitle")}</p>
            <div className="hero-actions">
              <Link href="/signup" className="btn btn-primary btn-lg">
                {t("landing.hero.cta_signup")}
                <i className="fa-solid fa-arrow-right" />
              </Link>
              <Link href="/demo/dashboard" className="btn btn-outline btn-lg">
                {t("landing.hero.cta_demo")}
              </Link>
            </div>
            <div className="hero-users">
              <div className="hero-users-icons">
                <span>
                  <i className="fa-solid fa-user" />
                </span>
                <span>
                  <i className="fa-solid fa-user" />
                </span>
                <span>
                  <i className="fa-solid fa-user" />
                </span>
              </div>
              <p>{t("landing.hero.users_line")}</p>
            </div>
          </div>
          <div className="landing-hero-preview">
            <LandingHeroDashboardMock
              intlLocale={intlLocale}
              t={t}
              paidPlanEnabled={Boolean(paidPlan?.enabled)}
            />
          </div>
        </div>
      </section>

      {paidPitch ? (
        <section className="landing-pricing-section" id="pricing">
          <div className="landing-pricing-inner">
            <div className="landing-pricing-visual">
              <Image
                src="/landing-coffee.svg"
                alt={t("landing.pricing.alt_coffee")}
                width={120}
                height={120}
                className="landing-pricing-coffee-img"
              />
            </div>
            <div className="landing-pricing-copy">
              <div className="section-label">{t("landing.pricing.label")}</div>
              <h2 className="landing-pricing-title">{t("landing.pricing.title")}</h2>
              <p className="landing-pricing-lead">{t("subscribe.hero.lead")}</p>
              <p className="landing-pricing-blurb">{paidPitch.blurb}</p>
              <div className="landing-pricing-cta">
                <Link href="/signup" className="btn btn-primary btn-lg">
                  {t("landing.hero.cta_signup")}
                  <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="landing-trust">
        <div className="landing-trust-inner">
          <p className="trust-title">{t("landing.trust.title")}</p>
          <div className="trust-grid">
            <div className="trust-item">
              <strong>100+</strong>
              <span>{t("landing.trust.stat_items_demo")}</span>
            </div>
            <div className="trust-item">
              <strong>6</strong>
              <span>{t("landing.trust.categories_demo")}</span>
            </div>
            <div className="trust-item">
              <strong>24/7</strong>
              <span>{t("landing.trust.online")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="features-inner">
          <div className="section-label">{t("landing.features.label")}</div>
          <h2 className="section-title">{t("landing.features.title")}</h2>
          <p className="section-sub section-sub-wide">{t("landing.features.intro")}</p>
          <div className="features-grid">
            {FEATURE_ROWS.map((f) => (
              <div key={f.id} className="feature-card">
                <div className="feature-icon-wrap">
                  <i className={f.icon} />
                </div>
                <h3>{t(`landing.features.cards.${f.id}.title`)}</h3>
                <p>{t(`landing.features.cards.${f.id}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how">
        <div className="how-inner">
          <div className="section-label">{t("landing.hiw.label")}</div>
          <h2 className="section-title">{t("landing.hiw.title")}</h2>
          <div className="steps-grid">
            <div className="step-card">
              <span>1</span>
              <h3>{t("landing.hiw.step1.title")}</h3>
              <p>{t("landing.hiw.step1.body")}</p>
            </div>
            <div className="step-card">
              <span>2</span>
              <h3>{t("landing.hiw.step2.title")}</h3>
              <p>{t("landing.hiw.step2.body")}</p>
            </div>
            <div className="step-card">
              <span>3</span>
              <h3>{t("landing.hiw.step3.title")}</h3>
              <p>{t("landing.hiw.step3.body")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-explore" id="demo">
        <div className="landing-explore-inner">
          <div className="section-label">{t("landing.explore.label")}</div>
          <h2 className="section-title">{t("landing.explore.title")}</h2>
          <div className="landing-explore-grid">
            <Link href="/demo/dashboard" className="landing-explore-card">
              <div className="landing-explore-card-icon">
                <i className="fa-solid fa-gauge-high" />
              </div>
              <h3>{t("landing.explore.dashboard.title")}</h3>
              <p>{t("landing.explore.dashboard.blurb")}</p>
              <span className="landing-explore-more">
                {t("landing.explore.dashboard.cta")}
                <i className="fa-solid fa-arrow-right" />
              </span>
            </Link>
            <Link
              href="/demo/analytics"
              className={
                "landing-explore-card landing-explore-card--analytics" +
                (paidPlan?.enabled ? " landing-explore-card--has-pro-hint" : "")
              }
            >
              <div className="landing-explore-card-icon">
                <i className="fa-solid fa-chart-line" />
              </div>
              {paidPlan?.enabled ? (
                <span className="landing-explore-pro-badge">
                  {t("landing.explore.pro_in_app_badge")}
                </span>
              ) : null}
              <h3>{t("landing.explore.analytics.title")}</h3>
              <p>{t("landing.explore.analytics.blurb")}</p>
              {paidPlan?.enabled ? (
                <p className="landing-explore-analytics-pro-hint">
                  {t("landing.explore.analytics.pro_hint")}
                </p>
              ) : null}
              <span className="landing-explore-more">
                {t("landing.explore.analytics.cta")}
                <i className="fa-solid fa-arrow-right" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-inner">
          <div className="section-label">{t("landing.faq.label")}</div>
          <h2 className="section-title">{t("landing.faq.title")}</h2>
          <div className="faq-grid">
            <details className="faq-item">
              <summary>{t("landing.faq.q_saved")}</summary>
              <p>{t("landing.faq.a_saved")}</p>
            </details>
            <details className="faq-item">
              <summary>{t("landing.faq.q_mobile")}</summary>
              <p>{t("landing.faq.a_mobile")}</p>
            </details>
            <details className="faq-item">
              <summary>{t("landing.faq.q_install")}</summary>
              <p>{t("landing.faq.a_install")}</p>
            </details>
            <details className="faq-item">
              <summary>{t("landing.faq.q_demo")}</summary>
              <p>{t("landing.faq.a_demo")}</p>
            </details>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="cta-box">
          <h2>{t("landing.cta.title")}</h2>
          <p>{t("landing.cta.subtitle")}</p>
          <div className="landing-cta-actions">
            <Link href="/signup" className="btn btn-white btn-lg">
              {t("landing.cta.btn_signup")}
              <i className="fa-solid fa-arrow-right" />
            </Link>
            <Link href="/demo/dashboard" className="btn btn-outline-light btn-lg">
              {t("landing.cta.btn_demo")}
            </Link>
          </div>
        </div>
      </section>

      <SiteLandingFooter byline />
    </>
  );
}

"use client";

import { useEffect } from "react";
import { NavDash } from "@/components/nav-dash";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import {
  ensureAuthedNotifyScriptsLoaded,
  loadScriptOnce,
} from "@/components/fs/load-fs-scripts";
import { FsDemoDashboardWindowFlag } from "@/components/fs/fs-demo-window-flags";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { FA_ICONS_ALL, FS_COLOR_DOTS } from "@/lib/fs-icons";
import type { FamilySharingDashboardBootstrap } from "@/lib/family-sharing/family-sharing-types";
import type { SubscriptionWithFamilyShare } from "@/lib/family-sharing/family-sharing-types";
import {
  isProFeaturePreviewLocked,
  type DashboardFreeTierGatePayload,
} from "@/lib/subscriptions/dashboard-free-tier-gate-payload";
import type { SubscriptionCategoryUiOption } from "@/lib/subscriptions/subscription-categories-server";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import Link from "next/link";
import { ProTrialProgressBlock } from "@/components/pro-trial/pro-trial-chrome";
import { ProFeaturePreviewCtaCard } from "@/components/pro-feature-preview-gate";
import {
  AppPageContentGate,
  dispatchSubtrackPageContentReady,
  useFsPageContentReady,
} from "@/components/app/app-page-content-gate";

export function DashboardFsView({
  userDisplay,
  initialSubscriptions,
  initialPaidCalendarDays = {},
  familySharingBootstrap = { enabled: false, links: [] },
  freeTierGate,
  categoryOptions = [],
  monthlyBudget = null,
  demoMode = false,
}: {
  userDisplay?: NavUserDisplay | null;
  initialSubscriptions: SubscriptionWithFamilyShare[];
  initialPaidCalendarDays?: Record<string, number>;
  familySharingBootstrap?: FamilySharingDashboardBootstrap;
  freeTierGate: DashboardFreeTierGatePayload;
  categoryOptions?: SubscriptionCategoryUiOption[];
  monthlyBudget?: number | null;
  /** Publiskais `/demo/dashboard`: bez API, navigācija paliek demo maršrutos. */
  demoMode?: boolean;
}) {
  const { t, paidPlan } = useSubtrackIntl();
  const calPaidToggleLabel = t("fs.dashboard.cal_toggle_all_payments_label");
  const calPaidToggleHint = t("fs.dashboard.cal_toggle_all_payments_hint");
  const calPaidToggleTitle = [calPaidToggleLabel, calPaidToggleHint]
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .join(" – ");

  const dynamicAmountLabel = t("fs.dashboard.label_dynamic_amount");
  const dynamicAmountHint = t("fs.dashboard.hint_dynamic_amount");
  const dynamicAmountToggleTitle = [dynamicAmountLabel, dynamicAmountHint]
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .join(" – ");
  const dynamicCarryLabel = t("fs.dashboard.label_dynamic_carry_previous");
  const dynamicCarryHint = t("fs.dashboard.hint_dynamic_carry_previous");
  const dynamicCarryToggleTitle = [dynamicCarryLabel, dynamicCarryHint]
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .join(" – ");

  const showGetProLink =
    freeTierGate.enforcement === true && freeTierGate.isPaidUser !== true;

  const calendarPreviewLocked = isProFeaturePreviewLocked(freeTierGate);

  const trialProgress = userDisplay?.proTrialProgress ?? null;
  const contentReady = useFsPageContentReady();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureAuthedNotifyScriptsLoaded();
        if (cancelled) return;
        await loadScriptOnce("/fs/js/modal-overlay-guard.js");
        if (cancelled) return;
        await loadScriptOnce("/fs/js/dashboard.js");
        if (cancelled) return;
        window.fsBootDashboard?.();
      } catch {
        dispatchSubtrackPageContentReady();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {demoMode ? <FsDemoDashboardWindowFlag /> : null}
      <div className="app-layout app-layout-stacked">
        <NavDash
          active="dashboard"
          userDisplay={userDisplay}
          demoMode={demoMode}
        />
        {demoMode ? (
          <div className="subtrack-demo-banner" role="status">
            <div className="subtrack-demo-banner-inner">
              <i className="fa-solid fa-circle-info" aria-hidden="true" />
              <p>{t("demo.banner")}</p>
              <Link
                href="/signup"
                className="btn btn-primary btn-sm subtrack-demo-banner-cta"
              >
                {t("landing.hero.cta_signup")}
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : null}
        <main className="main-content">
          {trialProgress ? (
            <ProTrialProgressBlock progress={trialProgress} fullWidth />
          ) : null}
          <AppPageContentGate ready={contentReady} className="app-page-content-gate--main">
          <div className="dashboard-overview">
            <div className="dashboard-overview-main">
              <div className="dashboard-overview-calendar-col">
                <div className="dashboard-top-calendar">
                  <div
                    className={
                      "pay-calendar-card" +
                      (calendarPreviewLocked ? " pay-calendar-card--preview-locked" : "")
                    }
                  >
                    {demoMode && paidPlan.enabled ? (
                      <span
                        className="dash-nav-pro-pill pay-calendar-pro-badge"
                        title={t("nav.analytics_demo_hint")}
                        aria-label={t("nav.analytics_demo_hint")}
                      >
                        {t("nav.pro_badge")}
                      </span>
                    ) : null}
                    <div className="pay-calendar-toolbar">
                      <button
                        type="button"
                        className="pay-cal-nav"
                        id="cal-prev"
                        aria-label={t("fs.dashboard.aria_calendar_prev_month")}
                      >
                        <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                      </button>
                      <h2 className="pay-calendar-title" id="pay-calendar-title">
                        &nbsp;
                      </h2>
                      <button
                        type="button"
                        className="pay-cal-nav"
                        id="cal-next"
                        aria-label={t("fs.dashboard.aria_calendar_next_month")}
                      >
                        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="pay-calendar-body">
                      <div
                        id="pay-calendar"
                        className="pay-calendar"
                        role="region"
                        aria-labelledby="pay-calendar-title"
                      />
                      {calendarPreviewLocked ? (
                        <div
                          className="pay-calendar-preview-overlay"
                          role="region"
                          aria-label={t("subscribe.benefit.calendar.title")}
                        >
                          <ProFeaturePreviewCtaCard feature="calendar" />
                        </div>
                      ) : null}
                    </div>
                    <div className="pay-calendar-footer">
                      <p className="pay-calendar-hint">
                        <span
                          className="pay-cal-legend-i pay-cal-legend-i--due"
                          aria-hidden="true"
                        />
                        {t("landing.mock.legend_due")}
                        <span className="pay-calendar-hint-sep">·</span>
                        <span
                          className="pay-cal-legend-i pay-cal-legend-i--overdue"
                          aria-hidden="true"
                        />
                        {t("landing.mock.legend_overdue")}
                        <span className="pay-calendar-hint-sep">·</span>
                        <span
                          className="pay-cal-legend-i pay-cal-legend-i--paid-past"
                          aria-hidden="true"
                        />
                        {t("fs.dashboard.legend_paid_marked")}
                      </p>
                      <div className="pay-calendar-toggle-row">
                        <SubtrackTooltip label={calPaidToggleTitle}>
                          <button
                            type="button"
                            role="switch"
                            className="admin-switch"
                            id="pay-cal-include-paid-switch"
                            aria-label={calPaidToggleTitle}
                            aria-checked={false}
                          >
                            <span className="admin-switch-track" aria-hidden="true" />
                            <span className="admin-switch-thumb" aria-hidden="true" />
                          </button>
                        </SubtrackTooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            <div className="dashboard-overview-right-col">
                <div className="dashboard-overview-head-col">
                  <div className="page-header">
                    <div className="page-header-title-stack">
                      <h1 className="page-title">
                        {t("landing.mock.subscriptions_title")}
                      </h1>
                      <p className="page-subtitle">{t("landing.mock.subscriptions_subtitle")}</p>
                    </div>
                    <div className="page-header-actions-column">
                      <button
                        type="button"
                        className="btn btn-primary"
                        data-subtrack-add-sub="1"
                        onClick={() => window.openAddModal?.()}
                      >
                        <i className="fa-solid fa-plus" /> {t("landing.mock.btn_add")}
                      </button>
                      {showGetProLink ? (
                        <Link href="/subscribe" className="dashboard-get-pro-link">
                          {t("dashboard.link_get_pro")}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div
                  className={
                    "dashboard-overview-stats-row" +
                    (monthlyBudget != null
                      ? " dashboard-overview-stats-row--has-budget"
                      : "")
                  }
                >
                  <div className="stat-card stat-card--total">
                    <div className="stat-label">{t("landing.mock.stat_total_label")}</div>
                    <div className="stat-card-main">
                      <div className="stat-value-row">
                        <div className="stat-value" id="stat-total">
                          €0.00
                        </div>
                        <span
                          id="stat-total-combined-mark"
                          className="stat-total-combined-mark hidden"
                          aria-hidden="true"
                        >
                          *
                        </span>
                      </div>
                    </div>
                    <div className="stat-card-foot stat-card-total-foot">
                      <div className="stat-note">{t("landing.mock.stat_total_note")}</div>
                      <div className="stat-card-total-foot-end">
                        <span
                          id="stat-own-only"
                          className="stat-own-only hidden"
                          tabIndex={-1}
                        />
                        <button
                          type="button"
                          id="stat-total-own-only-hint"
                          className="stat-total-own-only-hint hidden"
                          aria-hidden="true"
                          tabIndex={-1}
                        >
                          <i className="fas fa-info-circle" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">{t("landing.mock.stat_active_label")}</div>
                    <div className="stat-card-main">
                      <div className="stat-value" id="stat-count">
                        0
                      </div>
                    </div>
                    <div className="stat-card-foot">
                      <div className="stat-note">{t("landing.mock.stat_active_note")}</div>
                    </div>
                  </div>
                  {monthlyBudget != null ? (
                    <div
                      className="stat-card stat-card--budget"
                      id="stat-budget-card"
                    >
                      <div className="stat-label">{t("fs.dashboard.stat_budget_remaining_label")}</div>
                      <div className="stat-card-main">
                        <div className="stat-value" id="stat-budget-remaining">
                          €0.00
                        </div>
                        <div className="stat-budget-total" id="stat-budget-total">
                          €0.00
                        </div>
                      </div>
                      <div className="stat-card-foot">
                        <div className="stat-note" id="stat-budget-note">
                          {t("fs.dashboard.stat_budget_remaining_note")}
                        </div>
                      </div>
                      <div
                        className="stat-budget-progress"
                        role="progressbar"
                        id="stat-budget-progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={0}
                      >
                        <div className="stat-budget-progress-fill" id="stat-budget-progress-fill" />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="dashboard-overview-next-slot dashboard-next-pay-slot">
                  <div
                    id="stat-next-pay-root"
                    className="stat-next-pay-grid stat-next-pay-grid--cols-1"
                    aria-live="polite"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="section-header section-header--subscriptions-list">
            <h2 className="section-heading">{t("landing.mock.subscription_list_heading")}</h2>
          </div>

          <div
            id="dashboard-category-bar"
            className="dashboard-category-bar hidden"
            aria-live="polite"
          />

          <div id="sub-list" className="sub-list" />

          <div
            id="empty-state"
            className="empty-state empty-state--dashboard hidden"
            aria-live="polite"
          >
            <div className="empty-state-card">
              <div className="empty-state-icon-wrap" aria-hidden="true">
                <i className="fa-solid fa-calendar-days empty-state-main-icon" />
              </div>
              <h3>{t("fs.dashboard.empty_title")}</h3>
              <p className="empty-state-lead">{t("fs.dashboard.empty_lead")}</p>
              <div className="empty-state-cta-wrap">
                <button
                  type="button"
                  className="btn btn-primary"
                  data-subtrack-add-sub="1"
                  onClick={() => window.openAddModal?.()}
                >
                  <i className="fa-solid fa-plus" /> {t("fs.dashboard.empty_cta")}
                </button>
                {showGetProLink ? (
                  <Link href="/subscribe" className="dashboard-get-pro-link dashboard-get-pro-link--empty">
                    {t("dashboard.link_get_pro")}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
          </AppPageContentGate>
        </main>

        <SiteLandingFooter />
      </div>

      <div
        className="modal-overlay"
        id="modal-overlay"
        onClick={(e) => window.handleOverlayClick?.(e.nativeEvent)}
      >
        <div className="modal modal--wide" id="modal-main">
          <div className="modal-header">
            <h2 id="modal-title">{t("fs.dashboard.modal_add_title")}</h2>
            <button
              type="button"
              className="modal-close"
              id="modal-close-btn"
              onClick={() => window.closeModal?.()}
              aria-label={t("fs.dashboard.aria_modal_close")}
              data-tooltip={t("fs.dashboard.aria_modal_close")}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="sub-name">{t("fs.dashboard.label_name")}</label>
              <input
                type="text"
                id="sub-name"
                placeholder={t("fs.dashboard.placeholder_sub_name")}
              />
              <div
                id="sub-name-suggestions"
                className="sub-name-suggestions hidden"
                role="group"
                aria-label={t("fs.dashboard.name_suggestions_aria")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sub-category">{t("fs.dashboard.label_category")}</label>
              <select id="sub-category" className="form-select">
                {categoryOptions.length > 0 ? (
                  categoryOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="subscription">{t("landing.mock.pill_subscription")}</option>
                    <option value="bill">{t("landing.mock.pill_bill")}</option>
                    <option value="credit">{t("landing.mock.pill_credit")}</option>
                    <option value="leasing">{t("landing.mock.pill_leasing")}</option>
                    <option value="insurance">{t("landing.mock.pill_insurance")}</option>
                    <option value="other">{t("landing.mock.pill_other")}</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-row">
            <div className="form-group">
              <label htmlFor="sub-amount">
                {t("fs.dashboard.label_amount_eur")}{" "}
                <span className="form-optional">{t("fs.dashboard.optional_paren")}</span>
              </label>
                <input
                  type="text"
                  id="sub-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="9,99"
                />
              </div>
              <div className="form-group">
                <label htmlFor="sub-period">{t("fs.dashboard.label_billing_period")}</label>
                <select id="sub-period" className="form-select">
                  <option value="monthly">{t("fs.dashboard.select_period.monthly")}</option>
                  <option value="yearly">{t("fs.dashboard.select_period.yearly")}</option>
                  <option value="weekly">{t("fs.dashboard.select_period.weekly")}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sub-date">{t("landing.mock.next_pay_label")}</label>
              <input type="date" id="sub-date" />
            </div>

            <div className="form-group">
              <label>{t("fs.dashboard.label_icon")}</label>
              <div className="icon-picker-block" id="icon-picker">
                <div id="icon-picker-hints-shell" className="icon-picker-hints-shell">
                  <div
                    className="icon-picker-row icon-picker-row--hints"
                    id="icon-picker-hints"
                    role="group"
                    aria-label={t("fs.dashboard.label_icon")}
                  />
                  <p id="icon-picker-no-match-msg" className="form-hint form-hint--tight hidden" />
                </div>
                <div className="icon-picker-toolbar">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm icon-picker-toggle"
                    id="icon-picker-toggle"
                    onClick={() => window.toggleIconPickerExpand?.()}
                    aria-expanded="false"
                    aria-controls="icon-picker-expanded"
                  >
                    {t("fs.dashboard.icon_show_all")}
                  </button>
                  <span className="icon-picker-more-hint" id="icon-picker-library-hint">
                    {t("fs.dashboard.icon_library_count").replace(
                      "{count}",
                      String(FA_ICONS_ALL.length),
                    )}
                  </span>
                </div>
                <div id="icon-picker-expanded" className="icon-picker-expanded hidden">
                  <div className="form-group icon-picker-search-field">
                    <label htmlFor="icon-picker-q" className="icon-search-label">
                      {t("fs.dashboard.icon_search_label")}
                    </label>
                    <input
                      type="search"
                      id="icon-picker-q"
                      className="form-input"
                      autoComplete="off"
                      aria-label={t("fs.dashboard.icon_search_aria")}
                      placeholder={t("fs.dashboard.icon_search_placeholder")}
                      spellCheck={false}
                    />
                  </div>
                  <p
                    id="icon-picker-expanded-empty"
                    className="form-hint form-hint--tight hidden"
                    role="status"
                  />
                  <div
                    id="icon-picker-more"
                    className="icon-picker-row icon-picker-row--expanded"
                    role="group"
                    aria-label={t("fs.dashboard.aria_icon_more")}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>{t("fs.dashboard.label_color")}</label>
              <div className="color-picker-row" id="color-picker">
                {FS_COLOR_DOTS.map((c) => (
                  <div
                    key={c}
                    className="color-dot"
                    style={{ background: c }}
                    data-color={c}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sub-note">{t("fs.dashboard.label_note_optional")}</label>
              <input type="text" id="sub-note" placeholder={t("fs.dashboard.placeholder_note")} />
            </div>

            <div className="modal-advanced" id="modal-advanced">
              <button
                type="button"
                className="modal-advanced-toggle"
                id="modal-advanced-toggle"
                onClick={() => window.toggleModalAdvanced?.()}
                aria-expanded="false"
                aria-controls="modal-advanced-panel"
              >
                <span>{t("fs.dashboard.advanced_toggle")}</span>
                <i className="fa-solid fa-chevron-down modal-advanced-chevron" aria-hidden="true" />
              </button>
              <div className="modal-advanced-panel hidden" id="modal-advanced-panel">
                <p className="form-section-label">
                  {t("fs.dashboard.advanced_section_credit")}
                  <> </>
                  <span className="form-optional">{t("fs.dashboard.optional_paren")}</span>
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sub-term-start">
                      {t("fs.dashboard.term_start")}{" "}
                      <span className="form-optional">{t("fs.dashboard.optional_paren")}</span>
                    </label>
                    <input type="date" id="sub-term-start" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sub-term-end">
                      {t("fs.dashboard.term_end")}{" "}
                      <span className="form-optional">{t("fs.dashboard.optional_paren")}</span>
                    </label>
                    <input type="date" id="sub-term-end" />
                  </div>
                </div>

                <p className="form-section-label form-section-label--spaced">
                  {t("fs.dashboard.advanced_section_devices")}
                  <> </>
                  <span className="form-optional">{t("fs.dashboard.optional_paren")}</span>
                </p>
                <p className="form-hint form-hint--tight">{t("fs.dashboard.advanced_hint_devices")}</p>
                <div id="sub-devices-container" className="sub-devices-container" />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm modal-device-add"
                  onClick={() => window.addDeviceRow?.()}
                >
                  <i className="fa-solid fa-plus" /> {t("fs.dashboard.advanced_add_device")}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-footer modal-footer--with-dynamic">
            <div className="modal-footer-dynamic">
              <div className="modal-footer-dynamic-row">
                <SubtrackTooltip label={dynamicAmountToggleTitle}>
                  <button
                    type="button"
                    role="switch"
                    className="admin-switch"
                    id="sub-dynamic-amount-switch"
                    aria-label={dynamicAmountToggleTitle}
                    aria-checked={false}
                  >
                    <span className="admin-switch-track" aria-hidden="true" />
                    <span className="admin-switch-thumb" aria-hidden="true" />
                  </button>
                </SubtrackTooltip>
                <span className="modal-footer-dynamic-label">{dynamicAmountLabel}</span>
              </div>
              <div
                id="sub-dynamic-carry-wrap"
                className="modal-footer-dynamic-carry hidden"
              >
                <div className="modal-footer-dynamic-row">
                  <SubtrackTooltip label={dynamicCarryToggleTitle}>
                    <button
                      type="button"
                      role="switch"
                      className="admin-switch"
                      id="sub-dynamic-carry-switch"
                      aria-label={dynamicCarryToggleTitle}
                      aria-checked={false}
                    >
                      <span className="admin-switch-track" aria-hidden="true" />
                      <span className="admin-switch-thumb" aria-hidden="true" />
                    </button>
                  </SubtrackTooltip>
                  <span className="modal-footer-dynamic-carry-label">
                    {dynamicCarryLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn btn-ghost"
                id="modal-cancel-btn"
                onClick={() => window.closeModal?.()}
              >
                {t("fs.dashboard.btn_cancel")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                id="modal-save-btn"
                onClick={() => window.saveSubscription?.()}
              >
                <span className="btn-spinner dash-save-spinner hidden" aria-hidden="true" />
                <span className="dash-save-label">{t("fs.dashboard.modal_save")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal-overlay"
        id="delete-overlay"
        onClick={(e) => window.handleDeleteOverlayClick?.(e.nativeEvent)}
      >
        <div className="modal delete-modal">
          <div className="modal-body">
            <div className="delete-icon">
              <i className="fa-solid fa-trash-can" />
            </div>
            <h3>{t("fs.dashboard.delete_modal_heading")}</h3>
            <p id="delete-confirm-name">&nbsp;</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              id="delete-cancel-btn"
              onClick={() => window.closeDeleteModal?.()}
            >
              {t("fs.dashboard.btn_cancel")}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              id="delete-confirm-btn"
              onClick={() => window.confirmDelete?.()}
            >
              <span className="btn-spinner dash-delete-spinner hidden" aria-hidden="true" />
              <span className="dash-delete-label">{t("fs.dashboard.btn_delete")}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="toast-container" id="toast-container" />
    </>
  );
}

"use client";

import { useEffect } from "react";
import { NavDash } from "@/components/nav-dash";
import { SiteStandardCopyrightNotice } from "@/components/site-standard-copyright-notice";
import {
  ensureAuthedNotifyScriptsLoaded,
  loadScriptOnce,
} from "@/components/fs/load-fs-scripts";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import {
  FA_ICONS_MORE,
  FA_ICONS_PREVIEW,
  FS_COLOR_DOTS,
} from "@/lib/fs-icons";
import type { SubscriptionClient } from "@/lib/subscriptions/subscription-client";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

export function DashboardFsView({
  userDisplay,
  initialSubscriptions,
}: {
  userDisplay?: NavUserDisplay | null;
  initialSubscriptions: SubscriptionClient[];
}) {
  const { t } = useSubtrackIntl();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureAuthedNotifyScriptsLoaded();
        if (cancelled) return;
        await loadScriptOnce("/fs/js/dashboard.js");
        if (cancelled) return;
        window.fsBootDashboard?.();
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <script
        id="subtrack-subs-bootstrap-json"
        type="application/json"
        // eslint-disable-next-line react/no-danger -- Supabase JSON bootstrap pirms FS skriptiem
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(initialSubscriptions).replace(/</g, "\\u003c"),
        }}
      />
      <div className="app-layout app-layout-stacked">
        <NavDash active="dashboard" userDisplay={userDisplay} />
        <main className="main-content">
          <div className="dashboard-overview">
            <div className="dashboard-overview-main">
              <div className="dashboard-overview-calendar-col">
                <div className="dashboard-top-calendar">
                  <div className="pay-calendar-card">
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
                    <div
                      id="pay-calendar"
                      className="pay-calendar"
                      role="region"
                      aria-labelledby="pay-calendar-title"
                    />
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
                    </p>
                  </div>
                </div>
              </div>

              <div className="dashboard-overview-right-col">
                <div className="dashboard-overview-head-col">
                  <div className="page-header">
                    <div>
                      <h1 className="page-title">{t("landing.mock.subscriptions_title")}</h1>
                      <p className="page-subtitle">{t("landing.mock.subscriptions_subtitle")}</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => window.openAddModal?.()}
                    >
                      <i className="fa-solid fa-plus" /> {t("landing.mock.btn_add")}
                    </button>
                  </div>
                </div>

                <div className="dashboard-overview-stats-row">
                  <div className="stat-card">
                    <div className="stat-label">{t("landing.mock.stat_total_label")}</div>
                    <div className="stat-value" id="stat-total">
                      €0.00
                    </div>
                    <div className="stat-note">{t("landing.mock.stat_total_note")}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">{t("landing.mock.stat_active_label")}</div>
                    <div className="stat-value" id="stat-count">
                      0
                    </div>
                    <div className="stat-note">{t("landing.mock.stat_active_note")}</div>
                  </div>
                </div>

                <div className="dashboard-overview-next-slot dashboard-next-pay-slot">
                  <div className="stat-card stat-card--next-pay">
                    <div className="stat-label">{t("landing.mock.next_pay_label")}</div>
                    <div className="stat-next-body">
                      <div className="stat-next-text">
                        <div className="stat-value stat-value--next" id="stat-next">
                          -
                        </div>
                        <div className="stat-next-name" id="stat-next-name">
                          {t("fs.dashboard.empty_no_subscriptions")}
                        </div>
                      </div>
                      <div className="stat-next-amount" id="stat-next-amount" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-header section-header--subscriptions-list">
            <h2 className="section-heading">{t("landing.mock.subscription_list_heading")}</h2>
          </div>

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
                  onClick={() => window.openAddModal?.()}
                >
                  <i className="fa-solid fa-plus" /> {t("fs.dashboard.empty_cta")}
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="landing-footer">
          <SiteStandardCopyrightNotice />
        </footer>
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
            </div>

            <div className="form-group">
              <label htmlFor="sub-category">{t("fs.dashboard.label_category")}</label>
              <select id="sub-category" className="form-select">
                <option value="subscription">{t("landing.mock.pill_subscription")}</option>
                <option value="bill">{t("landing.mock.pill_bill")}</option>
                <option value="credit">{t("landing.mock.pill_credit")}</option>
                <option value="leasing">{t("landing.mock.pill_leasing")}</option>
                <option value="insurance">{t("landing.mock.pill_insurance")}</option>
                <option value="other">{t("landing.mock.pill_other")}</option>
              </select>
            </div>

            <div className="form-row">
            <div className="form-group">
              <label htmlFor="sub-amount">
                {t("fs.dashboard.label_amount_eur")}{" "}
                <span className="form-optional">{t("fs.dashboard.optional_paren")}</span>
              </label>
                <input
                  type="number"
                  id="sub-amount"
                  placeholder="9.99"
                  step="0.01"
                  min="0"
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
                <div
                  className="icon-picker-row icon-picker-row--preview"
                  role="group"
                  aria-label={t("fs.dashboard.label_icon")}
                >
                  {FA_ICONS_PREVIEW.map((ic) => (
                    <button key={ic} type="button" className="icon-opt" data-icon={ic}>
                      <i className={ic} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                {FA_ICONS_MORE.length > 0 ? (
                  <>
                    <div className="icon-picker-toolbar">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm icon-picker-toggle"
                        id="icon-picker-toggle"
                        onClick={() => window.toggleIconPickerExpand?.()}
                        aria-expanded="false"
                        aria-controls="icon-picker-more"
                      >
                        {t("fs.dashboard.icon_show_all")}
                      </button>
                      <span className="icon-picker-more-hint">
                        {t("fs.dashboard.icon_more_count").replace(
                          "{count}",
                          String(FA_ICONS_MORE.length),
                        )}
                      </span>
                    </div>
                    <div
                      className="icon-picker-row icon-picker-row--more hidden"
                      id="icon-picker-more"
                      role="group"
                      aria-label={t("fs.dashboard.aria_icon_more")}
                    >
                      {FA_ICONS_MORE.map((ic) => (
                        <button key={ic} type="button" className="icon-opt" data-icon={ic}>
                          <i className={ic} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
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
                <p className="form-hint form-hint--tight">{t("fs.dashboard.advanced_hint_credit")}</p>
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
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              id="modal-cancel-btn"
              onClick={() => window.closeModal?.()}
            >
              {t("fs.dashboard.btn_cancel")}
            </button>
            <button type="button" className="btn btn-primary" id="modal-save-btn" onClick={() => window.saveSubscription?.()}>
              <span className="btn-spinner dash-save-spinner hidden" aria-hidden="true" />
              <span className="dash-save-label">{t("fs.dashboard.modal_save")}</span>
            </button>
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
            <button type="button" className="btn btn-ghost" onClick={() => window.closeDeleteModal?.()}>
              {t("fs.dashboard.btn_cancel")}
            </button>
            <button type="button" className="btn btn-danger" onClick={() => window.confirmDelete?.()}>
              {t("fs.dashboard.btn_delete")}
            </button>
          </div>
        </div>
      </div>

      <div className="toast-container" id="toast-container" />
    </>
  );
}

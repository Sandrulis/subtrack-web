/**
 * Tulkošanas atslēgas, ko serverī ielādē lapām ar /fs/*.js demo skriptiem
 * un iedod `window.__SUBTRACK_FS_I18N`.
 */
export const FS_DEMO_CATEGORY_KEYS = [
  "landing.mock.pill_subscription",
  "landing.mock.pill_bill",
  "landing.mock.pill_credit",
  "landing.mock.pill_leasing",
  "landing.mock.pill_insurance",
  "landing.mock.pill_other",
] as const;

export const FS_ANALYTICS_DEMO_KEYS = [
  ...FS_DEMO_CATEGORY_KEYS,
  "fs.analytics.pie_empty",
  "fs.analytics.cat_empty",
  "fs.analytics.per_month_abbr",
  "fs.analytics.upcoming_note",
  "fs.analytics.next_none",
] as const;

export const FS_DASHBOARD_DEMO_EXTRA_KEYS = [
  ...FS_DEMO_CATEGORY_KEYS,
  "landing.mock.pay_line",
  "landing.mock.term_label",
  "fs.dashboard.term_done",
  "fs.dashboard.term_progress_suffix",
  "fs.dashboard.device_row_title",
  "fs.dashboard.device_extra_note",
  "fs.dashboard.tooltip_mark_paid",
  "fs.dashboard.aria_mark_paid",
  "fs.dashboard.tooltip_edit",
  "fs.dashboard.aria_edit",
  "fs.dashboard.tooltip_delete",
  "fs.dashboard.aria_delete",
  "fs.analytics.per_month_abbr",
  "fs.dashboard.empty_no_subscriptions",
  "fs.dashboard.empty_nothing_upcoming",
  "fs.dashboard.toast_marked_paid",
  "fs.dashboard.modal_add_title",
  "fs.dashboard.modal_add_submit",
  "fs.dashboard.modal_edit_title",
  "fs.dashboard.modal_save",
  "fs.dashboard.toast_term_end_after_start",
  "fs.dashboard.toast_name_required_when_addons",
  "fs.dashboard.list_untitled",
  "fs.dashboard.toast_saved",
  "fs.dashboard.toast_added",
  "fs.dashboard.delete_body",
  "fs.dashboard.toast_deleted",
  "fs.dashboard.icon_show_all",
  "fs.dashboard.icon_show_less",
  "fs.dashboard.icon_library_count",
  "fs.dashboard.icon_search_label",
  "fs.dashboard.icon_search_placeholder",
  "fs.dashboard.icon_search_aria",
  "fs.dashboard.icon_no_matches",
  "fs.dashboard.months_remaining",
  "fs.dashboard.period_monthly",
  "fs.dashboard.period_yearly",
  "fs.dashboard.period_weekly",
  "fs.dashboard.overdue_one",
  "fs.dashboard.overdue_other",
  "fs.dashboard.device_placeholder_name",
  "fs.dashboard.device_label_name",
  "fs.dashboard.device_label_note_optional",
  "fs.dashboard.device_label_extra_amount",
  "fs.dashboard.term_start",
  "fs.dashboard.term_end",
  "fs.dashboard.optional_paren",
  "fs.dashboard.aria_remove_device_row",
  "fs.dashboard.toast_device_name_when_term",
  "fs.dashboard.toast_device_term_order",
  "ui.modal.confirm_close_backdrop",
  "fs.dashboard.btn_cancel",
  "fs.dashboard.btn_save",
  "fs.dashboard.btn_delete",
  "fs.dashboard.toast_api_save_failed",
  "fs.dashboard.toast_api_delete_failed",
  "fs.dashboard.toast_demo_only",
  "fs.dashboard.cal_toggle_all_payments_label",
  "fs.dashboard.cal_toggle_all_payments_hint",
  "api.subscriptions.free_tier_limit",
] as const;

/** Tikai augšējās joslas paziņojumi (`dash-alerts.js` + `formatOverdueLabel`), ja nav pilnā paneļa bootstrap. Ietver arī „atzīmēt samaksāts” un toast tekstu vienam maksājumam. */
export const FS_NOTIFY_BAR_KEYS = [
  "fs.dashboard.overdue_one",
  "fs.dashboard.overdue_other",
  "fs.dashboard.toast_api_save_failed",
  "fs.dashboard.aria_mark_paid",
  "fs.dashboard.toast_marked_paid",
  "fs.dashboard.toast_demo_only",
] as const;

export function fsNotifyBarPhraseKeys(): string[] {
  return [...FS_NOTIFY_BAR_KEYS];
}

export function fsAnalyticsPhraseKeys(): string[] {
  return [...FS_ANALYTICS_DEMO_KEYS];
}

export function fsDashboardPhraseKeys(): string[] {
  return [...FS_DASHBOARD_DEMO_EXTRA_KEYS];
}

"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

/**
 * Augšējās joslas zvans + paziņojumu panelis (kopīgi `NavSessionActions` un demo viesiem).
 */
export function DashNotifyDropdown() {
  const { t } = useSubtrackIntl();
  return (
    <div className="dash-notify-wrap">
      <button
        type="button"
        className="dash-notify-btn"
        id="dash-notify-toggle"
        aria-expanded="false"
        aria-controls="dash-notify-panel"
        aria-label={t("session.notify_toggle_aria")}
      >
        <span
          id="dash-notify-icon"
          className="dash-notify-icon-slot"
          aria-hidden="true"
        >
          <svg
            className="dash-icon dash-notify-bell dash-notify-bell--solid hidden"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.31-2.69-6-6-6S6 7.69 6 11v5H4v2h16v-2h-2z"
            />
          </svg>
          <svg
            className="dash-icon dash-notify-bell dash-notify-bell--regular"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <path
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            />
          </svg>
        </span>
        <span className="dash-notify-badge hidden" id="dash-notify-badge">
          0
        </span>
      </button>
      <button
        type="button"
        className="dash-notify-menu-backdrop hidden"
        id="dash-notify-backdrop"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div
        className="dash-notify-panel hidden"
        id="dash-notify-panel"
        role="region"
        aria-label={t("session.notify_panel_aria")}
      >
        <div className="dash-notify-panel-inner">
          <div className="dash-notify-head">
            <span className="dash-notify-head-title">{t("session.notify_title")}</span>
          </div>
          <div
            className="dash-notify-section hidden"
            id="dash-notify-family-section"
          >
            <h3 className="dash-notify-section-title">
              {t("family_sharing.section_incoming")}
            </h3>
            <div className="dash-notify-list" id="dash-notify-family-list" />
          </div>
          <div
            className="dash-notify-empty hidden"
            id="dash-notify-empty"
            role="status"
            aria-live="polite"
          >
            <div className="dash-notify-empty-icon" aria-hidden="true">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21a2 2 0 01-3.46 0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="dash-notify-empty-lead">{t("session.notify_empty_lead")}</p>
          </div>
          <div
            className="dash-notify-today hidden"
            id="dash-notify-today-section"
          >
            <h3 className="dash-notify-section-title dash-notify-today-heading">
              {t("session.notify_today_title")}
            </h3>
            <div className="dash-notify-list" id="dash-notify-today-list" />
          </div>
          <div
            className="dash-notify-section hidden"
            id="dash-notify-overdue-section"
          >
            <h3 className="dash-notify-section-title">{t("session.notify_overdue")}</h3>
            <div className="dash-notify-list" id="dash-notify-overdue-list" />
          </div>
          <div
            className="dash-notify-section hidden"
            id="dash-notify-upcoming-section"
          >
            <h3 className="dash-notify-section-title">{t("session.notify_upcoming")}</h3>
            <div className="dash-notify-list" id="dash-notify-upcoming-list" />
          </div>
        </div>
      </div>
    </div>
  );
}

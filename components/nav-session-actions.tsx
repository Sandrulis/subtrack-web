import { signOutAction } from "@/lib/auth/actions";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { NavUserMenu } from "@/components/nav-user-menu";

type NavSessionActionsProps = {
  userDisplay: NavUserDisplay | null | undefined;
  /** Ja true, lietotāja izvēlnē papildus „Panelis“ (piem. sākumlapā). */
  showDashboardInUserMenu?: boolean;
};

/**
 * Paneļa un ielogotās sākumlapas augšējās labās darbības: zvans, profils, iziet.
 */
export function NavSessionActions({
  userDisplay,
  showDashboardInUserMenu = false,
}: NavSessionActionsProps) {
  return (
    <div className="dash-actions">
      <div className="dash-notify-wrap">
        <button
          type="button"
          className="dash-notify-btn"
          id="dash-notify-toggle"
          aria-expanded="false"
          aria-controls="dash-notify-panel"
          aria-label="Paziņojumi"
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
        <div
          className="dash-notify-panel hidden"
          id="dash-notify-panel"
          role="region"
          aria-label="Maksājumu paziņojumi"
        >
          <div className="dash-notify-panel-inner">
            <div className="dash-notify-head">
              <span className="dash-notify-head-title">Paziņojumi</span>
            </div>
            <div
              className="dash-notify-section"
              id="dash-notify-overdue-section"
            >
              <h3 className="dash-notify-section-title">Kavētie maksājumi</h3>
              <div
                className="dash-notify-list"
                id="dash-notify-overdue-list"
              />
            </div>
            <div
              className="dash-notify-section"
              id="dash-notify-upcoming-section"
            >
              <h3 className="dash-notify-section-title">Gaidāmie maksājumi</h3>
              <div
                className="dash-notify-list"
                id="dash-notify-upcoming-list"
              />
            </div>
          </div>
        </div>
      </div>
      <span
        className="dash-topbar-rule dash-topbar-rule--actions"
        aria-hidden="true"
      />
      <NavUserMenu
        userDisplay={userDisplay}
        showDashboardInUserMenu={showDashboardInUserMenu}
      />
      <span
        className="dash-topbar-rule dash-topbar-rule--actions"
        aria-hidden="true"
      />
      <form action={signOutAction} className="dash-exit-form">
        <button type="submit" className="dash-exit">
          <svg
            className="dash-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5-5-5zM4 5h7V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H4V5z"
            />
          </svg>
          <span className="dash-exit-text">Iziet</span>
        </button>
      </form>
    </div>
  );
}

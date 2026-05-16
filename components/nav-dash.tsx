import Link from "next/link";

export type NavDashActive = "dashboard" | "analytics" | "";

type NavDashProps = {
  active?: NavDashActive;
};

export function NavDash({ active = "" }: NavDashProps) {
  return (
    <header className="dash-topbar">
      <div className="dash-topbar-shell">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <Link href="/" className="dash-brand">
              <span className="dash-brand-text">SubTrack</span>
            </Link>
            <span className="dash-topbar-rule" aria-hidden="true" />
            <nav className="dash-nav-links" aria-label="Galvenā navigācija">
              <Link
                href="/dashboard"
                className={
                  "dash-nav-link" + (active === "dashboard" ? " is-active" : "")
                }
                aria-current={active === "dashboard" ? "page" : undefined}
              >
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
                    d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
                  />
                </svg>
                <span className="dash-nav-link-text">Panelis</span>
              </Link>
              <Link
                href="/analytics"
                className={
                  "dash-nav-link" + (active === "analytics" ? " is-active" : "")
                }
                aria-current={active === "analytics" ? "page" : undefined}
              >
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
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v8h8c0 4.41-3.59 8-8 8z"
                  />
                </svg>
                <span className="dash-nav-link-text">Analītika</span>
              </Link>
            </nav>
          </div>
          <div className="dash-topbar-right">
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
                  <span
                    className="dash-notify-badge hidden"
                    id="dash-notify-badge"
                  >
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
                    <div className="dash-notify-section" id="dash-notify-overdue-section">
                      <h3 className="dash-notify-section-title">
                        Kavētie maksājumi
                      </h3>
                      <div
                        className="dash-notify-list"
                        id="dash-notify-overdue-list"
                      />
                    </div>
                    <div className="dash-notify-section" id="dash-notify-upcoming-section">
                      <h3 className="dash-notify-section-title">
                        Gaidāmie maksājumi
                      </h3>
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
              <div
                className="dash-user-wrap"
                tabIndex={0}
                aria-haspopup="true"
                aria-label="Lietotāja izvēlne"
              >
                <div className="dash-user">
                  <span className="user-avatar">JB</span>
                  <span className="dash-user-name">Jānis Bērziņš</span>
                </div>
                <div className="dash-user-dropdown" role="menu">
                  <Link
                    href="/change-password"
                    className="dash-user-dropdown-item"
                    role="menuitem"
                  >
                    <svg
                      className="dash-user-dropdown-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="currentColor"
                        d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H9V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2z"
                      />
                    </svg>
                    <span>Mainīt paroli</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="dash-user-dropdown-item"
                    role="menuitem"
                  >
                    <svg
                      className="dash-user-dropdown-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="currentColor"
                        d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.49-.42h-3.84c-.24 0-.43.17-.49.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.31-.07.63-.07.94s.02.63.06.93l-2.03 1.58a.49.49 0 00-.11.61l1.92 3.31c.12.23.37.31.58.21l2.39-.96c.5.39 1.03.71 1.62.93l.36 2.54c.05.24.25.43.49.43h3.83c.25 0 .44-.17.49-.41l.36-2.54c.59-.23 1.13-.56 1.62-.93l2.39.96c.22.08.47 0 .59-.22l1.92-3.31c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                      />
                    </svg>
                    <span>Iestatījumi</span>
                  </Link>
                </div>
              </div>
              <span
                className="dash-topbar-rule dash-topbar-rule--actions"
                aria-hidden="true"
              />
              <Link href="/login" className="dash-exit">
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
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

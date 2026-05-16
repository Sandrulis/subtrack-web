import Link from "next/link";

export type NavLandingActive = "" | "login" | "signup";

type NavLandingProps = {
  active?: NavLandingActive;
};

export function NavLanding({ active = "" }: NavLandingProps) {
  return (
    <header className="dash-topbar">
      <div className="dash-topbar-shell">
        <div className="dash-topbar-inner">
          <div className="dash-topbar-left">
            <Link href="/" className="dash-brand">
              <span className="dash-brand-text">SubTrack</span>
            </Link>
            <span className="dash-topbar-rule" aria-hidden="true" />
            <nav className="dash-nav-links" aria-label="Sākumlapas sadaļas">
              <Link
                href="/#features"
                className="dash-nav-link"
                data-landing-anchor="features"
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
                    d="M4 11h7V4H4v7zm0 9h7v-7H4v7zm9 0h7v-7h-7v7zm0-11h7V4h-7v7z"
                  />
                </svg>
                <span className="dash-nav-link-text">Iespējas</span>
              </Link>
              <Link
                href="/#demo"
                className="dash-nav-link"
                data-landing-anchor="demo"
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
                <span className="dash-nav-link-text">Demonstrācija</span>
              </Link>
              <Link
                href="/#faq"
                className="dash-nav-link"
                data-landing-anchor="faq"
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
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v2z"
                  />
                </svg>
                <span className="dash-nav-link-text">FAQ</span>
              </Link>
            </nav>
          </div>
          <div className="dash-topbar-right">
            <div className="dash-actions">
              <Link
                href="/login"
                className={
                  "dash-nav-link" + (active === "login" ? " is-active" : "")
                }
                aria-current={active === "login" ? "page" : undefined}
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
                    d="M11 7L9.41 8.59 11 10H5v4h6l-1.59 1.59L11 17l5-5-5-5zm8 14h-8v-2h8V6h-8V4h8a2 2 0 012 2v12a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="dash-nav-link-text">Ieiet</span>
              </Link>
              <Link
                href="/signup"
                className={
                  "dash-nav-link dash-nav-link--cta" +
                  (active === "signup" ? " is-active" : "")
                }
                aria-current={active === "signup" ? "page" : undefined}
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
                    d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3V9H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  />
                </svg>
                <span className="dash-nav-link-text">Reģistrēties</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

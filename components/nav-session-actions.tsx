"use client";

import { DashNotifyDropdown } from "@/components/dash-notify-dropdown";
import { NavUiLanguageSwitcher } from "@/components/nav-ui-language-switcher";
import { NavUserMenu } from "@/components/nav-user-menu";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { signOutAction } from "@/lib/auth/actions";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { clearNativeAuthSession } from "@/lib/capacitor/native-auth-session";
import { useNativeCapacitorApp } from "@/lib/capacitor/use-native-capacitor-app";
import { syncAppBadgeCount } from "@/lib/pwa/app-badge";

type NavSessionActionsProps = {
  userDisplay: NavUserDisplay | null | undefined;
  /** Ja true, lietotāja izvēlnē papildus „Panelis“ (piem. sākumlapā). */
  showDashboardInUserMenu?: boolean;
};

/**
 * Paneļa un ielogotās sākumlapas augšējās labās darbības: valoda, zvans, profils, iziet.
 */
export function NavSessionActions({
  userDisplay,
  showDashboardInUserMenu = false,
}: NavSessionActionsProps) {
  const { t } = useSubtrackIntl();
  const isNativeApp = useNativeCapacitorApp();
  return (
    <div className="dash-actions">
      <NavUiLanguageSwitcher layout="topbar" />
      <DashNotifyDropdown />
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
        {isNativeApp ? (
          <input type="hidden" name="native_app" value="1" />
        ) : null}
        <button
          type="submit"
          className="dash-exit"
          onClick={() => {
            void syncAppBadgeCount(0);
            if (isNativeApp) void clearNativeAuthSession();
          }}
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
              d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5-5-5zM4 5h7V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H4V5z"
            />
          </svg>
          <span className="dash-exit-text">{t("session.sign_out")}</span>
        </button>
      </form>
    </div>
  );
}

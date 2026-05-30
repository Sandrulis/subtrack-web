"use client";

import Link from "next/link";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import {
  NavUserBillingMenuItem,
  NavUserBillingModal,
  NavUserBillingQueryListener,
  useNavUserBillingVisible,
} from "@/components/billing/nav-user-billing-entry";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { navUserHasPaidProMembership } from "@/lib/auth/pro-plan-access";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { UserAvatar } from "@/components/user-avatar";

type NavUserMenuProps = {
  userDisplay: NavUserDisplay | null | undefined;
  showDashboardInUserMenu?: boolean;
};

const SUBTRACK_NOTIFY_OPENED = "subtrack:notify-opened";
const SUBTRACK_USER_MENU_OPENED = "subtrack:user-menu-opened";
const SUBTRACK_LANG_MENU_OPENED = "subtrack:lang-menu-opened";

/**
 * Lietotāja izvēlne: tap/click atver aizvēr; ārpuses pieskāriens aizver.
 * Mobilajām ierīcēm - fona slānis un lielāki pieskāriena mērķi (CSS).
 */
export function NavUserMenu({
  userDisplay,
  showDashboardInUserMenu = false,
}: NavUserMenuProps) {
  const { t, integrations } = useSubtrackIntl();
  const displayName =
    userDisplay?.displayName?.trim() || t("session.user_fallback_name");
  const initials = userDisplay?.initials?.trim() || "?";
  const hasPaidPro = navUserHasPaidProMembership(userDisplay);
  const hasTrialOnly =
    userDisplay?.proTrialActive === true && !hasPaidPro;
  const triggerAria = hasPaidPro
    ? `${displayName} (${t("session.paid_plan_badge_aria")}): ${t("session.user_menu_aria_suffix")}`
    : hasTrialOnly
      ? `${displayName} (${t("trial.badge_aria")}): ${t("session.user_menu_aria_suffix")}`
      : `${displayName}: ${t("session.user_menu_aria_suffix")}`;
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const billing = useNavUserBillingVisible(userDisplay);

  useEffect(() => {
    if (!open) return;

    function closeIfOutside(e: MouseEvent | TouchEvent) {
      const el = wrapRef.current;
      if (!el) return;
      const target = e.target;
      if (target instanceof Node && el.contains(target)) return;
      setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("touchstart", closeIfOutside, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("touchstart", closeIfOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    function onLangOpened() {
      setOpen(false);
    }
    window.addEventListener(SUBTRACK_LANG_MENU_OPENED, onLangOpened);
    return () =>
      window.removeEventListener(SUBTRACK_LANG_MENU_OPENED, onLangOpened);
  }, []);

  useEffect(() => {
    function onNotifyOpened() {
      setOpen(false);
    }
    window.addEventListener(SUBTRACK_NOTIFY_OPENED, onNotifyOpened);
    return () =>
      window.removeEventListener(SUBTRACK_NOTIFY_OPENED, onNotifyOpened);
  }, []);

  return (
    <>
    <Suspense fallback={null}>
      <NavUserBillingQueryListener userDisplay={userDisplay} />
    </Suspense>
    {billing ? (
      <NavUserBillingModal
        billing={billing}
        displayPrefs={userDisplay?.displayPreferences}
        open={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
      />
    ) : null}
    <div
      ref={wrapRef}
      className={
        "dash-user-wrap" + (open ? " dash-user-menu-is-open" : "")
      }
    >
      <button
        type="button"
        className="dash-user-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={triggerAria}
        onClick={() =>
          setOpen((v) => {
            const next = !v;
            if (next) {
              queueMicrotask(() => {
                try {
                  window.dispatchEvent(
                    new CustomEvent(SUBTRACK_USER_MENU_OPENED),
                  );
                } catch {
                  /* ignore */
                }
              });
            }
            return next;
          })
        }
      >
        <span className="dash-user">
          <span className="dash-user-avatar-wrap">
            {hasPaidPro ? (
              <span className="dash-paid-crown" aria-hidden="true">
                <i className="fa-solid fa-crown" />
              </span>
            ) : null}
            <UserAvatar
              initials={initials}
              avatarUrl={userDisplay?.avatarUrl}
              className="user-avatar"
            />
          </span>
          <span className="dash-user-name">{displayName}</span>
        </span>
      </button>
      {open ? (
        <button
          type="button"
          className="dash-user-menu-backdrop"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div
        id={menuId}
        className="dash-user-dropdown"
        role="menu"
        aria-hidden={!open}
        hidden={!open}
      >
        <Link
          href="/change-password"
          prefetch={false}
          className="dash-user-dropdown-item"
          role="menuitem"
          onClick={() => setOpen(false)}
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
          <span>{t("session.change_password")}</span>
        </Link>
        {integrations.familySharingEnabled ? (
          <Link
            href="/family-sharing"
            prefetch={false}
            className="dash-user-dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
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
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
              />
            </svg>
            <span>{t("session.family_sharing")}</span>
          </Link>
        ) : null}
        <Link
          href="/email-notifications"
          prefetch={false}
          className="dash-user-dropdown-item"
          role="menuitem"
          onClick={() => setOpen(false)}
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
              d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"
            />
          </svg>
          <span>{t("session.email_notifications")}</span>
        </Link>
        <NavUserBillingMenuItem
          userDisplay={userDisplay}
          onCloseMenu={() => setOpen(false)}
          onOpenModal={() => setBillingModalOpen(true)}
        />
        <Link
          href="/settings"
          prefetch={false}
          className="dash-user-dropdown-item"
          role="menuitem"
          onClick={() => setOpen(false)}
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
          <span>{t("session.settings")}</span>
        </Link>
        {showDashboardInUserMenu ? (
          <Link
            href="/dashboard"
            prefetch={false}
            className="dash-user-dropdown-item"
            role="menuitem"
            onClick={() => setOpen(false)}
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
                d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
              />
            </svg>
            <span>{t("nav.dashboard")}</span>
          </Link>
        ) : null}
      </div>
    </div>
    </>
  );
}

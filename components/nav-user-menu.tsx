"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { NavUserDisplay } from "@/lib/auth/user-display";

type NavUserMenuProps = {
  userDisplay: NavUserDisplay | null | undefined;
  showDashboardInUserMenu?: boolean;
};

/**
 * Lietotāja izvēlne: tap/click atver aizvēr; ārpuses pieskāriens aizver.
 * Mobilajām ierīcēm - fona slānis un lielāki pieskāriena mērķi (CSS).
 */
export function NavUserMenu({
  userDisplay,
  showDashboardInUserMenu = false,
}: NavUserMenuProps) {
  const displayName = userDisplay?.displayName?.trim() || "Lietotājs";
  const initials = userDisplay?.initials?.trim() || "?";
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  return (
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
        aria-label={`${displayName}: lietotāja izvēlne`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dash-user">
          <span className="user-avatar" aria-hidden="true">
            {initials}
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
          <span>Mainīt paroli</span>
        </Link>
        <Link
          href="/settings"
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
          <span>Iestatījumi</span>
        </Link>
        {showDashboardInUserMenu ? (
          <Link
            href="/dashboard"
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
            <span>Panelis</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

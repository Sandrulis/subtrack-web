"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { applyUiLocaleInBrowser } from "@/lib/html-lang";
import { languageCodeToFlagEmoji } from "@/lib/ui/language-code-flag-emoji";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
  readDisplayPreferencesFromLocalStorage,
  writeDisplayPreferencesToLocalStorage,
} from "@/lib/user-display-preferences";
import { useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SUBTRACK_NOTIFY_OPENED = "subtrack:notify-opened";
const SUBTRACK_USER_MENU_OPENED = "subtrack:user-menu-opened";
const SUBTRACK_LANG_MENU_OPENED = "subtrack:lang-menu-opened";

type Layout = "topbar" | "mobile";

export function NavUiLanguageSwitcher({ layout = "topbar" }: { layout?: Layout }) {
  const { t, locale, languageOptions } = useSubtrackIntl();
  const router = useRouter();
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (layout !== "mobile" || typeof document === "undefined") return;
    queueMicrotask(() => setPortalTarget(document.body));
  }, [layout]);

  useEffect(() => {
    function close() {
      setOpen(false);
    }
    window.addEventListener(SUBTRACK_NOTIFY_OPENED, close);
    window.addEventListener(SUBTRACK_USER_MENU_OPENED, close);
    return () => {
      window.removeEventListener(SUBTRACK_NOTIFY_OPENED, close);
      window.removeEventListener(SUBTRACK_USER_MENU_OPENED, close);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function closeIfOutside(e: MouseEvent | TouchEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (wrapRef.current?.contains(target)) return;
      if (
        layout === "mobile" &&
        target instanceof Element &&
        target.closest(".dash-lang-dropdown")
      ) {
        return;
      }
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
  }, [open, layout]);

  if (languageOptions.length < 2) return null;

  const current = languageOptions.find((o) => o.code === locale) ?? languageOptions[0]!;
  const flag = languageCodeToFlagEmoji(locale);

  function applyLanguage(code: string) {
    const norm = code.trim().toLowerCase();
    if (!languageOptions.some((o) => o.code === norm)) return;
    const merged = mergeDisplayPreferences(
      readDisplayPreferencesFromLocalStorage(),
      DISPLAY_PREFERENCES_DEFAULTS,
    );
    const next = mergeDisplayPreferences({ interface_language_code: norm }, merged);
    if (!writeDisplayPreferencesToLocalStorage(next)) return;
    applyUiLocaleInBrowser(norm);
    setOpen(false);
    router.refresh();
  }

  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next) {
        try {
          window.dispatchEvent(new CustomEvent(SUBTRACK_LANG_MENU_OPENED));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }

  const list = (
    <div
      className={
        layout === "topbar" ? "dash-lang-dropdown" : "dash-lang-dropdown dash-lang-dropdown--mobile"
      }
      id={menuId}
      role="listbox"
      aria-label={t("nav.ui_language_menu_aria")}
    >
      {languageOptions.map((opt) => {
        const active = opt.code === locale;
        const optFlag = languageCodeToFlagEmoji(opt.code);
        const ariaOpt = t("nav.ui_language_option_aria").replace("{label}", opt.label);
        return (
          <button
            key={opt.code}
            type="button"
            role="option"
            aria-selected={active}
            className={"dash-lang-item" + (active ? " is-active" : "")}
            onClick={() => applyLanguage(opt.code)}
            disabled={active}
            aria-label={ariaOpt}
          >
            <span className="dash-lang-item-flag" aria-hidden="true">
              {optFlag}
            </span>
            <span className="dash-lang-item-label">{opt.label}</span>
            {active ? (
              <span className="dash-lang-item-check" aria-hidden="true">
                <i className="fa-solid fa-check" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );

  const triggerClass =
    layout === "topbar" ? "dash-lang-trigger" : "mobile-bottom-nav-link dash-lang-trigger--mob";

  return (
    <>
      <div
        ref={wrapRef}
        className={
          layout === "topbar"
            ? "dash-lang-wrap dash-lang-wrap--topbar" + (open ? " dash-lang-wrap-is-open" : "")
            : "mobile-lang-wrap" + (open ? " dash-lang-wrap-is-open" : "")
        }
      >
        <button
          type="button"
          className={triggerClass}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={menuId}
          aria-label={t("nav.ui_language_aria")}
          title={current.label}
          onClick={toggle}
        >
          <span className="dash-lang-trigger-flag" aria-hidden="true">
            {flag}
          </span>
          {layout === "topbar" ? (
            <span className="dash-lang-trigger-caret" aria-hidden="true">
              <i className="fa-solid fa-chevron-down" />
            </span>
          ) : null}
        </button>
        {open && layout === "topbar" ? (
          <button
            type="button"
            className="dash-lang-menu-backdrop"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
        ) : null}
        {open && layout === "topbar" ? list : null}
      </div>
      {open && layout === "mobile" && portalTarget
        ? createPortal(
            <>
              <button
                type="button"
                className="dash-lang-mob-scrim"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => setOpen(false)}
              />
              {list}
            </>,
            portalTarget,
          )
        : null}
    </>
  );
}

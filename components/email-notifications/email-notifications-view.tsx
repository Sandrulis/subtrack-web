"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NavDash } from "@/components/nav-dash";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import {
  readEmailNotificationPreferences,
  type EmailNotificationPreferences,
} from "@/lib/emails/email-notification-preferences";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import {
  AppPageContentGate,
  useClientPageContentReady,
} from "@/components/app/app-page-content-gate";

const AUTOSAVE_DEBOUNCE_MS = 450;

type NotifKind = "due_today" | "weekly" | "trial_end";

function EmailNotificationSwitch({
  checked,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`admin-switch email-notif-switch${checked ? " is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="admin-switch-track" aria-hidden />
      <span className="admin-switch-thumb" aria-hidden />
    </button>
  );
}

const NOTIF_ICONS: Record<NotifKind, string> = {
  due_today: "fa-calendar-day",
  weekly: "fa-envelope-open-text",
  trial_end: "fa-hourglass-half",
};

function EmailNotificationToggleRow({
  kind,
  title,
  hint,
  checked,
  busy,
  onChange,
}: {
  kind: NotifKind;
  title: string;
  hint: string;
  checked: boolean;
  busy?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <li
      className={
        "email-notif-item" + (checked ? " email-notif-item--on" : " email-notif-item--off")
      }
    >
      <span
        className={`email-notif-item-icon email-notif-item-icon--${kind}`}
        aria-hidden="true"
      >
        <i className={`fa-solid ${NOTIF_ICONS[kind]}`} />
      </span>
      <div className="email-notif-item-body">
        <h3 className="email-notif-item-title">{title}</h3>
        <p className="email-notif-item-desc">{hint}</p>
      </div>
      <div className="email-notif-item-action">
        <EmailNotificationSwitch
          checked={checked}
          disabled={busy}
          onChange={onChange}
          ariaLabel={title}
        />
      </div>
    </li>
  );
}

export function EmailNotificationsView({
  userDisplay,
  initialPreferences,
}: {
  userDisplay?: NavUserDisplay | null;
  initialPreferences: unknown;
}) {
  const { t } = useSubtrackIntl();
  const contentReady = useClientPageContentReady();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showTrialToggle = userDisplay?.proTrialActive === true;

  const [prefs, setPrefs] = useState<EmailNotificationPreferences>(() =>
    readEmailNotificationPreferences(initialPreferences),
  );
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(async (snapshot: EmailNotificationPreferences) => {
    setBusy(true);
    pushDomToast(t("email.notifications.toast_saving"), "info");
    try {
      const res = await fetch("/api/user/email-notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueToday: snapshot.dueToday,
          weekly: snapshot.weekly,
          trialEnd: snapshot.trialEnd,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };
      if (!res.ok || !data.success) {
        pushDomToast(data.message ?? t("email.notifications.toast_error"), "error");
        return;
      }
      pushDomToast(t("email.notifications.toast_saved"), "success");
    } catch {
      pushDomToast(t("email.notifications.toast_error"), "error");
    } finally {
      setBusy(false);
    }
  }, [t]);

  const scheduleSave = useCallback(
    (next: EmailNotificationPreferences) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void persist(next);
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [persist],
  );

  function update(patch: Partial<EmailNotificationPreferences>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      scheduleSave(next);
      return next;
    });
  }

  useEffect(() => {
    if (searchParams.get("disable") !== "weekly") return;
    setPrefs((prev) => {
      if (!prev.weekly) return prev;
      const next = { ...prev, weekly: false };
      void persist(next);
      return next;
    });
    router.replace("/email-notifications");
  }, [searchParams, router, persist]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      <NavDash userDisplay={userDisplay} />
      <AppPageContentGate ready={contentReady}>
        <div className="auth-page-inner auth-page-inner--email-notif">
        <div className="auth-card auth-card--settings auth-card--email-notif">
          <header className="email-notif-header">
            <div className="email-notif-header-icon" aria-hidden="true">
              <i className="fa-solid fa-bell" />
            </div>
            <div className="email-notif-header-text">
              <h1 className="email-notif-title">{t("email.notifications.title")}</h1>
              <p className="email-notif-lead">{t("email.notifications.lead")}</p>
            </div>
          </header>

          <section className="email-notif-section" aria-labelledby="email-notif-section-heading">
            <h2 id="email-notif-section-heading" className="email-notif-section-label">
              {t("email.notifications.section_reminders")}
            </h2>
            <ul className="email-notif-list">
              <EmailNotificationToggleRow
                kind="due_today"
                title={t("email.notifications.toggle_due_today")}
                hint={t("email.notifications.hint_due_today")}
                checked={prefs.dueToday}
                busy={busy}
                onChange={(next) => update({ dueToday: next })}
              />
              <EmailNotificationToggleRow
                kind="weekly"
                title={t("email.notifications.toggle_weekly")}
                hint={t("email.notifications.hint_weekly")}
                checked={prefs.weekly}
                busy={busy}
                onChange={(next) => update({ weekly: next })}
              />
              {showTrialToggle ? (
                <EmailNotificationToggleRow
                  kind="trial_end"
                  title={t("email.notifications.toggle_trial_end")}
                  hint={t("email.notifications.hint_trial_end")}
                  checked={prefs.trialEnd}
                  busy={busy}
                  onChange={(next) => update({ trialEnd: next })}
                />
              ) : null}
            </ul>
          </section>

          <p className="dash-settings-hint-box email-notif-footnote">
            <i className="fa-solid fa-circle-info" aria-hidden="true" />{" "}
            {t("email.notifications.footnote")}
          </p>

          <nav className="email-notif-nav" aria-label={t("email.notifications.title")}>
            <Link href="/settings" className="email-notif-nav-link">
              <i className="fa-solid fa-sliders" aria-hidden="true" />
              {t("session.settings")}
            </Link>
            <Link href="/dashboard" className="email-notif-nav-link">
              <i className="fa-solid fa-table-columns" aria-hidden="true" />
              {t("settings.link_dashboard")}
            </Link>
          </nav>
        </div>
        </div>
      </AppPageContentGate>

      <SiteLandingFooter showAuthedActionLinks={Boolean(userDisplay)} />
      <div className="toast-container toast-container--auth-pages" id="toast-container" />
    </>
  );
}

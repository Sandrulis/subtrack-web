"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  readEmailNotificationPreferences,
  type EmailNotificationPreferences,
} from "@/lib/emails/email-notification-preferences";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { NavUserDisplay } from "@/lib/auth/user-display";

const AUTOSAVE_DEBOUNCE_MS = 450;

type NotifKind = "due_today" | "weekly" | "trial_end" | "win_back";

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
  win_back: "fa-door-open",
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

export function SettingsEmailNotificationsPanel({
  userDisplay,
  initialPreferences,
}: {
  userDisplay?: NavUserDisplay | null;
  initialPreferences: unknown;
}) {
  const { t } = useSubtrackIntl();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showTrialToggle = userDisplay?.proTrialActive === true;

  const [prefs, setPrefs] = useState<EmailNotificationPreferences>(() =>
    readEmailNotificationPreferences(initialPreferences),
  );
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    async (snapshot: EmailNotificationPreferences) => {
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
            winBack: snapshot.winBack,
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
    },
    [t],
  );

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
    const nextQs = new URLSearchParams(searchParams.toString());
    nextQs.delete("disable");
    const tail = nextQs.toString();
    router.replace(tail ? `/settings?${tail}` : "/settings");
  }, [searchParams, router, persist]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <section
      className="settings-hub-panel auth-card auth-card--email-notif settings-hub-panel--email"
      aria-labelledby="settings-hub-email-heading"
    >
      <header className="email-notif-header settings-hub-panel-header">
        <div className="email-notif-header-icon" aria-hidden="true">
          <i className="fa-solid fa-bell" />
        </div>
        <div className="email-notif-header-text">
          <h2 id="settings-hub-email-heading" className="settings-hub-panel-title email-notif-title">
            {t("email.notifications.title")}
          </h2>
          <p className="email-notif-lead">{t("email.notifications.lead")}</p>
        </div>
      </header>

      <div className="email-notif-section" aria-labelledby="settings-hub-email-section-heading">
        <h3 id="settings-hub-email-section-heading" className="email-notif-section-label">
          {t("email.notifications.section_reminders")}
        </h3>
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
          <EmailNotificationToggleRow
            kind="win_back"
            title={t("email.notifications.toggle_win_back")}
            hint={t("email.notifications.hint_win_back")}
            checked={prefs.winBack}
            busy={busy}
            onChange={(next) => update({ winBack: next })}
          />
        </ul>
      </div>

      <p className="dash-settings-hint-box email-notif-footnote">
        <i className="fa-solid fa-circle-info" aria-hidden="true" />{" "}
        {t("email.notifications.footnote")}
      </p>
    </section>
  );
}

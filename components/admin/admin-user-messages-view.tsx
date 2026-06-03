"use client";

import { FeedbackStarRating } from "@/components/feedback/feedback-star-rating";
import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  deleteAdminFeedbackAction,
  deleteAdminSuggestionAction,
  deleteAdminSupportRequestAction,
  setAdminFeedbackLandingAction,
} from "@/lib/admin/admin-user-messages-actions";
import type {
  AdminFeedbackRow,
  AdminSuggestionRow,
  AdminSupportRequestRow,
  AdminUserMessageTab,
} from "@/lib/admin/admin-user-messages-types";
import { formatDateTimeIntl } from "@/lib/admin/format-user-last-seen-display";
import { pushDomToast } from "@/lib/push-dom-toast";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AdminUserMessagesViewProps = {
  suggestions: AdminSuggestionRow[];
  feedback: AdminFeedbackRow[];
  supportRequests: AdminSupportRequestRow[];
  loadError: string | null;
  initialTab: AdminUserMessageTab;
};

const TABS: AdminUserMessageTab[] = ["suggestions", "feedback", "support"];

export function AdminUserMessagesView({
  suggestions: initialSuggestions,
  feedback: initialFeedback,
  supportRequests: initialSupport,
  loadError,
  initialTab,
}: AdminUserMessagesViewProps) {
  const { t, locale } = useSubtrackIntl();
  const router = useRouter();
  const intlLocale = useMemo(
    () => uiLocaleCodeToBcp47ForIntl(locale),
    [locale],
  );
  const [tab, setTab] = useState<AdminUserMessageTab>(initialTab);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [supportRequests, setSupportRequests] = useState(initialSupport);
  const [busyId, setBusyId] = useState<string | null>(null);

  function switchTab(next: AdminUserMessageTab) {
    setTab(next);
    router.replace(`/admin/user-messages?tab=${next}`, { scroll: false });
  }

  function formatWhen(iso: string): string {
    return formatDateTimeIntl(iso, intlLocale) || "—";
  }

  async function handleDeleteSuggestion(id: string) {
    if (busyId || !window.confirm(t("admin.user_messages.confirm_delete_suggestion"))) {
      return;
    }
    setBusyId(id);
    try {
      const res = await deleteAdminSuggestionAction(id);
      if (res.ok) {
        setSuggestions((prev) => prev.filter((row) => row.id !== id));
        pushDomToast(t("admin.user_messages.toast_suggestion_deleted"), "success");
      } else {
        pushDomToast(res.message, "error");
      }
    } catch {
      pushDomToast(t("admin.user_messages.err_delete_failed"), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteFeedback(id: string) {
    if (busyId || !window.confirm(t("admin.user_messages.confirm_delete_feedback"))) {
      return;
    }
    setBusyId(id);
    try {
      const res = await deleteAdminFeedbackAction(id);
      if (res.ok) {
        setFeedback((prev) => prev.filter((row) => row.id !== id));
        pushDomToast(t("admin.user_messages.toast_feedback_deleted"), "success");
      } else {
        pushDomToast(res.message, "error");
      }
    } catch {
      pushDomToast(t("admin.user_messages.err_delete_failed"), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleLanding(row: AdminFeedbackRow) {
    if (busyId) return;
    const next = !row.approvedForLanding;
    setBusyId(row.id);
    setFeedback((prev) =>
      prev.map((item) =>
        item.id === row.id ? { ...item, approvedForLanding: next } : item,
      ),
    );
    try {
      const res = await setAdminFeedbackLandingAction(row.id, next);
      if (!res.ok) {
        setFeedback((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? { ...item, approvedForLanding: row.approvedForLanding }
              : item,
          ),
        );
        pushDomToast(res.message, "error");
      } else {
        pushDomToast(
          next
            ? t("admin.user_messages.toast_feedback_landing_on")
            : t("admin.user_messages.toast_feedback_landing_off"),
          "success",
        );
      }
    } catch {
      setFeedback((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? { ...item, approvedForLanding: row.approvedForLanding }
            : item,
        ),
      );
      pushDomToast(t("admin.user_messages.err_save_failed"), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteSupport(id: string) {
    if (busyId || !window.confirm(t("admin.user_messages.confirm_delete_support"))) {
      return;
    }
    setBusyId(id);
    try {
      const res = await deleteAdminSupportRequestAction(id);
      if (res.ok) {
        setSupportRequests((prev) => prev.filter((row) => row.id !== id));
        pushDomToast(t("admin.user_messages.toast_support_deleted"), "success");
      } else {
        pushDomToast(res.message, "error");
      }
    } catch {
      pushDomToast(t("admin.user_messages.err_delete_failed"), "error");
    } finally {
      setBusyId(null);
    }
  }

  const tabCounts = {
    suggestions: suggestions.length,
    feedback: feedback.length,
    support: supportRequests.length,
  };

  return (
    <>
      <div className="admin-page-head">
        <h1 className="admin-page-title">{t("admin.user_messages.heading")}</h1>
        <p className="admin-page-lead">{t("admin.user_messages.lead")}</p>
      </div>

      <div
        className="admin-user-messages-tabs"
        role="tablist"
        aria-label={t("admin.user_messages.tabs_aria")}
      >
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            className={
              "admin-user-messages-tab" + (tab === key ? " is-active" : "")
            }
            aria-selected={tab === key}
            onClick={() => switchTab(key)}
          >
            {t(`admin.user_messages.tab_${key}`)}
            <span className="admin-user-messages-tab-count">{tabCounts[key]}</span>
          </button>
        ))}
      </div>

      {loadError ? (
        <p className="admin-alert admin-alert--error" role="alert">
          {loadError}
        </p>
      ) : null}

      {tab === "suggestions" ? (
        <section role="tabpanel" className="admin-user-messages-panel">
          {suggestions.length === 0 && !loadError ? (
            <p className="admin-empty">{t("admin.user_messages.empty_suggestions")}</p>
          ) : (
            <ul className="admin-user-messages-list">
              {suggestions.map((row) => (
                <li key={row.id} className="admin-user-messages-card">
                  <div className="admin-user-messages-card-head">
                    <div>
                      <p className="admin-user-messages-card-title">{row.title}</p>
                      <p className="admin-user-messages-card-meta">
                        {row.authorDisplay}
                        {row.authorEmail ? (
                          <>
                            {" · "}
                            <a href={`mailto:${row.authorEmail}`}>{row.authorEmail}</a>
                          </>
                        ) : null}
                        {" · "}
                        {formatWhen(row.createdAt)}
                        {" · "}
                        {t("admin.user_messages.votes_label").replace(
                          "{n}",
                          String(row.voteCount),
                        )}
                      </p>
                    </div>
                    <div className="admin-actions-cell">
                      <SubtrackTooltip label={t("admin.user_messages.action_delete")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--delete"
                          disabled={busyId === row.id}
                          aria-label={t("admin.user_messages.action_delete")}
                          aria-busy={busyId === row.id}
                          onClick={() => void handleDeleteSuggestion(row.id)}
                        >
                          <IconTrash />
                        </button>
                      </SubtrackTooltip>
                    </div>
                  </div>
                  <p className="admin-user-messages-card-body">{row.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "feedback" ? (
        <section role="tabpanel" className="admin-user-messages-panel">
          {feedback.length === 0 && !loadError ? (
            <p className="admin-empty">{t("admin.user_messages.empty_feedback")}</p>
          ) : (
            <ul className="admin-user-messages-list">
              {feedback.map((row) => (
                <li key={row.id} className="admin-user-messages-card">
                  <div className="admin-user-messages-card-head">
                    <div>
                      <FeedbackStarRating value={row.starRating} size="sm" />
                      <p className="admin-user-messages-card-meta">
                        {row.authorDisplay}
                        {row.authorEmail ? (
                          <>
                            {" · "}
                            <a href={`mailto:${row.authorEmail}`}>{row.authorEmail}</a>
                          </>
                        ) : null}
                        {" · "}
                        {formatWhen(row.createdAt)}
                      </p>
                    </div>
                    <div className="admin-user-messages-card-actions admin-actions-cell">
                      <label className="admin-user-messages-landing-toggle">
                        <input
                          type="checkbox"
                          className="admin-switch"
                          checked={row.approvedForLanding}
                          disabled={busyId === row.id}
                          onChange={() => void handleToggleLanding(row)}
                        />
                        <span>{t("admin.user_messages.landing_toggle")}</span>
                      </label>
                      <SubtrackTooltip label={t("admin.user_messages.action_delete")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--delete"
                          disabled={busyId === row.id}
                          aria-label={t("admin.user_messages.action_delete")}
                          aria-busy={busyId === row.id}
                          onClick={() => void handleDeleteFeedback(row.id)}
                        >
                          <IconTrash />
                        </button>
                      </SubtrackTooltip>
                    </div>
                  </div>
                  <p className="admin-user-messages-card-body">{row.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "support" ? (
        <section role="tabpanel" className="admin-user-messages-panel">
          <p className="admin-user-messages-support-hint">
            {t("admin.user_messages.support_hint_before")}{" "}
            <Link href="/admin/system">{t("admin.nav.system")}</Link>
            {t("admin.user_messages.support_hint_after")}
          </p>
          {supportRequests.length === 0 && !loadError ? (
            <p className="admin-empty">{t("admin.user_messages.empty_support")}</p>
          ) : (
            <ul className="admin-user-messages-list">
              {supportRequests.map((row) => (
                <li key={row.id} className="admin-user-messages-card">
                  <div className="admin-user-messages-card-head">
                    <div>
                      <p className="admin-user-messages-card-meta">
                        {row.authorDisplay}
                        {row.authorEmail ? (
                          <>
                            {" · "}
                            <a href={`mailto:${row.authorEmail}`}>{row.authorEmail}</a>
                          </>
                        ) : null}
                        {" · "}
                        {formatWhen(row.createdAt)}
                        {row.emailSent ? (
                          <>
                            {" · "}
                            <span className="admin-user-messages-badge">
                              {t("admin.user_messages.email_sent_badge")}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="admin-actions-cell">
                      <SubtrackTooltip label={t("admin.user_messages.action_delete")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--delete"
                          disabled={busyId === row.id}
                          aria-label={t("admin.user_messages.action_delete")}
                          aria-busy={busyId === row.id}
                          onClick={() => void handleDeleteSupport(row.id)}
                        >
                          <IconTrash />
                        </button>
                      </SubtrackTooltip>
                    </div>
                  </div>
                  <p className="admin-user-messages-card-body">{row.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}

function IconTrash() {
  return (
    <svg
      className="admin-btn-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  );
}

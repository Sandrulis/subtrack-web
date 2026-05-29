"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  createSuggestionAction,
  fetchSuggestionsAction,
  toggleSuggestionVoteAction,
} from "@/lib/suggestions/suggestions-actions";
import type { SuggestionRow } from "@/lib/suggestions/types";
import { handleModalBackdropMouseDown } from "@/lib/ui/modal-overlay-guard";
import { pushDomToast } from "@/lib/push-dom-toast";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { useCallback, useEffect, useId, useState } from "react";

const TITLE_MAX = 160;
const BODY_MAX = 2000;

type SuggestionsModalProps = {
  open: boolean;
  onClose: () => void;
};

function formatSuggestionDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(uiLocaleCodeToBcp47ForIntl(locale), {
    dateStyle: "medium",
  }).format(d);
}

export function SuggestionsModal({ open, onClose }: SuggestionsModalProps) {
  const titleId = useId();
  const { t, locale } = useSubtrackIntl();
  const [items, setItems] = useState<SuggestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetchSuggestionsAction();
      if (res.ok) {
        setItems(res.items);
      } else {
        setLoadError(res.message);
        setItems([]);
      }
    } catch {
      setLoadError(t("suggestions.err_load_failed"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!open) return;
    setShowForm(false);
    setTitle("");
    setBody("");
    setBusy(false);
    setVotingId(null);
    void reload();
  }, [open, reload]);

  useEffect(() => {
    if (!open || busy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("body", body.trim());
      const res = await createSuggestionAction(fd);
      if (res.ok) {
        pushDomToast(t("suggestions.toast_created"), "success");
        setShowForm(false);
        setTitle("");
        setBody("");
        await reload();
      } else {
        pushDomToast(res.message, "error");
      }
    } catch {
      pushDomToast(t("suggestions.err_create_failed"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleVote(item: SuggestionRow) {
    if (votingId) return;
    setVotingId(item.id);
    const wasVoted = item.viewerVoted;
    const delta = wasVoted ? -1 : 1;
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? {
              ...row,
              viewerVoted: !wasVoted,
              voteCount: Math.max(0, row.voteCount + delta),
            }
          : row,
      ),
    );
    try {
      const res = await toggleSuggestionVoteAction(item.id);
      if (!res.ok) {
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? {
                  ...row,
                  viewerVoted: wasVoted,
                  voteCount: Math.max(0, row.voteCount - delta),
                }
              : row,
          ),
        );
        pushDomToast(res.message, "error");
      } else {
        await reload();
      }
    } catch {
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                viewerVoted: wasVoted,
                voteCount: Math.max(0, row.voteCount - delta),
              }
            : row,
        ),
      );
      pushDomToast(t("suggestions.err_vote_failed"), "error");
    } finally {
      setVotingId(null);
    }
  }

  return (
    <div
      className="modal-overlay open"
      role="presentation"
      onMouseDown={(e) =>
        handleModalBackdropMouseDown(e, onClose, {
          busy: busy || Boolean(votingId),
          confirmMessage: t("ui.modal.confirm_close_backdrop"),
        })
      }
    >
      <div
        className="modal modal--wide suggestions-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header suggestions-modal-header">
          <div className="suggestions-modal-head-main">
            <span className="suggestions-modal-head-icon" aria-hidden="true">
              <i className="fas fa-child" />
            </span>
            <div>
              <h2 id={titleId}>{t("suggestions.modal_title")}</h2>
              <p className="suggestions-modal-subtitle">{t("suggestions.modal_lead")}</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            disabled={busy || Boolean(votingId)}
            aria-label={t("suggestions.modal_close_aria")}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body suggestions-modal-body">
          {showForm ? (
            <form className="suggestions-form" onSubmit={handleCreate} noValidate>
              <p className="suggestions-form-intro">{t("suggestions.form_intro")}</p>
              <div className="form-group">
                <label htmlFor="suggestion_title">{t("suggestions.label_title")}</label>
                <input
                  id="suggestion_title"
                  name="title"
                  type="text"
                  required
                  minLength={3}
                  maxLength={TITLE_MAX}
                  value={title}
                  disabled={busy}
                  placeholder={t("suggestions.placeholder_title")}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="suggestion_body">{t("suggestions.label_body")}</label>
                <textarea
                  id="suggestion_body"
                  name="body"
                  rows={4}
                  required
                  minLength={10}
                  maxLength={BODY_MAX}
                  value={body}
                  disabled={busy}
                  placeholder={t("suggestions.placeholder_body")}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <div className="suggestions-form-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => setShowForm(false)}
                >
                  {t("suggestions.btn_back_to_list")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    busy || title.trim().length < 3 || body.trim().length < 10
                  }
                >
                  {busy ? t("suggestions.btn_submitting") : t("suggestions.btn_submit")}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="suggestions-toolbar">
                <button
                  type="button"
                  className="btn btn-primary suggestions-toolbar-add"
                  onClick={() => setShowForm(true)}
                >
                  <i className="fas fa-plus" aria-hidden="true" />
                  <span>{t("suggestions.btn_add")}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm suggestions-toolbar-refresh"
                  disabled={loading}
                  onClick={() => void reload()}
                >
                  <i
                    className={
                      "fas fa-rotate-right" + (loading ? " suggestions-spin" : "")
                    }
                    aria-hidden="true"
                  />
                  <span>
                    {loading ? t("suggestions.loading") : t("suggestions.btn_refresh")}
                  </span>
                </button>
              </div>

              {loadError ? (
                <p className="suggestions-alert suggestions-alert--error" role="alert">
                  {loadError}
                </p>
              ) : null}

              {loading && items.length === 0 && !loadError ? (
                <div className="suggestions-state suggestions-state--loading" aria-busy="true">
                  <span className="suggestions-state-spinner" aria-hidden="true" />
                  <p>{t("suggestions.loading")}</p>
                </div>
              ) : null}

              {!loading && !loadError && items.length === 0 ? (
                <div className="suggestions-state suggestions-state--empty">
                  <span className="suggestions-state-icon" aria-hidden="true">
                    <i className="fas fa-lightbulb" />
                  </span>
                  <p className="suggestions-state-title">{t("suggestions.empty")}</p>
                  <p className="suggestions-state-hint">{t("suggestions.empty_hint")}</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowForm(true)}
                  >
                    {t("suggestions.btn_add")}
                  </button>
                </div>
              ) : null}

              <ul className="suggestions-list" aria-live="polite">
                {items.map((item) => (
                  <li key={item.id} className="suggestions-item">
                    <button
                      type="button"
                      className={
                        "suggestions-vote-btn" +
                        (item.viewerVoted ? " is-voted" : "") +
                        (votingId === item.id ? " is-busy" : "")
                      }
                      disabled={Boolean(votingId)}
                      aria-pressed={item.viewerVoted}
                      aria-label={
                        item.viewerVoted
                          ? t("suggestions.vote_remove_aria")
                          : t("suggestions.vote_add_aria")
                      }
                      onClick={() => void handleVote(item)}
                    >
                      <i className="fas fa-chevron-up" aria-hidden="true" />
                      <span className="suggestions-vote-count">{item.voteCount}</span>
                    </button>
                    <div className="suggestions-item-main">
                      <p className="suggestions-item-title">{item.title}</p>
                      <p className="suggestions-item-body">{item.body}</p>
                      <p className="suggestions-item-meta">
                        {item.isOwn
                          ? t("suggestions.meta_own")
                          : item.authorDisplay}
                        {" · "}
                        {formatSuggestionDate(item.createdAt, locale)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="modal-footer suggestions-modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("suggestions.btn_close")}
          </button>
        </div>
      </div>
    </div>
  );
}

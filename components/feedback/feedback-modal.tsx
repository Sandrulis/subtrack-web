"use client";

import { FeedbackStarRating } from "@/components/feedback/feedback-star-rating";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  fetchOwnFeedbackAction,
  saveFeedbackAction,
} from "@/lib/feedback/feedback-actions";
import { handleModalBackdropMouseDown } from "@/lib/ui/modal-overlay-guard";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useEffect, useId, useLayoutEffect, useState } from "react";

const BODY_MAX = 1200;

type FeedbackModalProps = {
  open: boolean;
  onClose: () => void;
};

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const titleId = useId();
  const ratingLabelId = useId();
  const hintId = useId();
  const { t } = useSubtrackIntl();
  const [body, setBody] = useState("");
  const [starRating, setStarRating] = useState(0);
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    setBusy(false);
    setLoadError(null);
    setLoading(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    void (async () => {
      try {
        const res = await fetchOwnFeedbackAction();
        if (res.ok) {
          if (res.feedback) {
            setBody(res.feedback.body);
            setStarRating(res.feedback.starRating);
            setHasExisting(true);
          } else {
            setBody("");
            setStarRating(0);
            setHasExisting(false);
          }
        } else {
          setLoadError(res.message);
          setBody("");
          setStarRating(0);
          setHasExisting(false);
        }
      } catch {
        setLoadError(t("feedback.err_load_failed"));
        setBody("");
        setStarRating(0);
        setHasExisting(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, t]);

  useEffect(() => {
    if (!open || busy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || loading) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("body", body.trim());
      fd.set("star_rating", String(starRating));
      const res = await saveFeedbackAction(fd);
      if (res.ok) {
        pushDomToast(
          hasExisting ? t("feedback.toast_updated") : t("feedback.toast_created"),
          "success",
        );
        onClose();
      } else {
        pushDomToast(res.message, "error");
      }
    } catch {
      pushDomToast(t("feedback.err_create_failed"), "error");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    !loading &&
    !loadError &&
    body.trim().length >= 10 &&
    starRating >= 1 &&
    starRating <= 5;

  const formDisabled = busy || loading || Boolean(loadError);

  return (
    <div
      className="modal-overlay open"
      role="presentation"
      onMouseDown={(e) =>
        handleModalBackdropMouseDown(e, onClose, {
          busy,
          confirmMessage: t("ui.modal.confirm_close_backdrop"),
        })
      }
    >
      <div
        className="modal feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header feedback-modal-header">
          <div className="feedback-modal-head-main">
            <span className="feedback-modal-head-icon" aria-hidden="true">
              <i className="far fa-thumbs-up" />
            </span>
            <div>
              <h2 id={titleId}>{t("feedback.modal_title")}</h2>
              <p className="feedback-modal-subtitle" id={hintId}>
                {t("feedback.modal_lead")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            disabled={busy}
            aria-label={t("feedback.modal_close_aria")}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form className="feedback-form" onSubmit={handleSave} noValidate>
          <div
            className={
              "modal-body feedback-modal-body" + (loading ? " feedback-modal-body--loading" : "")
            }
            aria-busy={loading}
          >
            {loadError ? (
              <p className="feedback-alert feedback-alert--error" role="alert">
                {loadError}
              </p>
            ) : null}

            <div className="form-group">
              <span id={ratingLabelId} className="feedback-label-block">
                {t("feedback.label_rating")}
              </span>
              <FeedbackStarRating
                value={starRating}
                onChange={setStarRating}
                disabled={formDisabled}
                labelId={ratingLabelId}
              />
              <p className="form-hint">{t("feedback.rating_hint")}</p>
            </div>
            <div className="form-group">
              <label htmlFor="feedback_body">{t("feedback.label_body")}</label>
              <textarea
                id="feedback_body"
                name="body"
                rows={5}
                required
                minLength={10}
                maxLength={BODY_MAX}
                value={body}
                disabled={formDisabled}
                aria-describedby={hintId}
                placeholder={t("feedback.placeholder_body")}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer feedback-modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={onClose}
            >
              {t("feedback.btn_close")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !canSubmit}
            >
              {busy ? t("feedback.btn_submitting") : t("feedback.btn_submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { submitSupportRequestAction } from "@/lib/support/support-actions";
import { handleModalBackdropMouseDown } from "@/lib/ui/modal-overlay-guard";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useEffect, useId, useState } from "react";

const MESSAGE_MAX = 4000;

type SupportHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SupportHelpModal({ open, onClose }: SupportHelpModalProps) {
  const titleId = useId();
  const hintId = useId();
  const { t } = useSubtrackIntl();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setSent(false);
    setBusy(false);
  }, [open]);

  useEffect(() => {
    if (!open || busy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || sent) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("message", message.trim());
      const res = await submitSupportRequestAction(fd);
      if (res.ok) {
        setSent(true);
        pushDomToast(t("support.toast_sent"), "success");
      } else {
        pushDomToast(res.message, "error");
      }
    } catch {
      pushDomToast(t("support.err_send_failed"), "error");
    } finally {
      setBusy(false);
    }
  }

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
        className="modal support-help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId}>{t("support.modal_title")}</h2>
          <button
            type="button"
            className="modal-close"
            disabled={busy}
            aria-label={t("support.modal_close_aria")}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {sent ? (
          <>
            <div className="modal-body">
              <p>{t("support.modal_success")}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                {t("support.btn_close")}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body support-help-form">
              <p className="form-hint" id={hintId}>
                {t("support.modal_lead")}
              </p>
              <div className="form-group">
                <label htmlFor="support_message">{t("support.label_message")}</label>
                <textarea
                  id="support_message"
                  name="message"
                  rows={6}
                  required
                  minLength={10}
                  maxLength={MESSAGE_MAX}
                  value={message}
                  disabled={busy}
                  aria-describedby={hintId}
                  placeholder={t("support.placeholder_message")}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={onClose}
              >
                {t("support.btn_cancel")}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={busy || message.trim().length < 10}
              >
                {busy ? t("support.btn_sending") : t("support.btn_send")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

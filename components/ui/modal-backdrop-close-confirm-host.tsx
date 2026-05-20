"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import {
  emitModalBackdropCloseConfirmResult,
  MODAL_BACKDROP_CLOSE_CONFIRM_REQUEST,
  type ModalBackdropCloseConfirmRequestDetail,
} from "@/lib/ui/modal-backdrop-close-confirm-bus";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type PendingRequest = ModalBackdropCloseConfirmRequestDetail;

export function ModalBackdropCloseConfirmHost() {
  const { t } = useSubtrackIntl();
  const titleId = useId();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState<PendingRequest | null>(null);

  const title = t("ui.modal.confirm_close_title");
  const stayLabel = t("ui.modal.confirm_close_stay");
  const confirmLabel = t("ui.modal.confirm_close_confirm");

  const finish = useCallback((confirmed: boolean) => {
    setPending((current) => {
      if (current) emitModalBackdropCloseConfirmResult(current.requestId, confirmed);
      return null;
    });
  }, []);

  useEffect(() => {
    const onRequest = (e: Event) => {
      const detail = (e as CustomEvent<ModalBackdropCloseConfirmRequestDetail>).detail;
      if (!detail?.requestId || !detail.message?.trim()) return;
      setPending({ requestId: detail.requestId, message: detail.message.trim() });
    };
    window.addEventListener(MODAL_BACKDROP_CLOSE_CONFIRM_REQUEST, onRequest);
    return () =>
      window.removeEventListener(MODAL_BACKDROP_CLOSE_CONFIRM_REQUEST, onRequest);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
    };
    window.addEventListener("keydown", onKey);
    const tmr = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(tmr);
    };
  }, [pending, finish]);

  if (!pending) return null;

  return (
    <div
      className="modal-overlay modal-backdrop-close-confirm-overlay open"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) finish(false);
      }}
    >
      <div
        className="modal modal-backdrop-close-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <div className="modal-backdrop-close-confirm-icon" aria-hidden="true">
            <i className="fa-solid fa-circle-question" />
          </div>
          <h3 id={titleId}>{title}</h3>
          <p>{pending.message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={() => finish(false)}>
            {stayLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="btn btn-primary"
            onClick={() => finish(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

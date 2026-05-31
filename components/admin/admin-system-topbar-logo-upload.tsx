"use client";

import {
  removeSystemTopbarLogoAction,
  uploadSystemTopbarLogoAction,
} from "@/lib/admin/logo-actions";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useCallback, useRef, useState, useTransition } from "react";

type AdminSystemTopbarLogoUploadProps = {
  initialTopbarLogoRevision: number;
  disabled?: boolean;
};

function buildPreviewUrl(revision: number): string | null {
  if (revision <= 0) return null;
  return `/brand/topbar-logo.png?v=${revision}`;
}

export function AdminSystemTopbarLogoUpload({
  initialTopbarLogoRevision,
  disabled = false,
}: AdminSystemTopbarLogoUploadProps) {
  const { t } = useSubtrackIntl();
  const [revision, setRevision] = useState(initialTopbarLogoRevision);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const hasLogo = revision > 0;

  const uploadFile = useCallback(
    (file: File | null | undefined) => {
      if (!file || disabled || pending) return;
      const fd = new FormData();
      fd.set("logo", file);
      startTransition(async () => {
        pushDomToast(t("admin.forms.toast_saving"), "info");
        try {
          const res = await uploadSystemTopbarLogoAction(fd);
          if (res.ok) {
            setRevision(res.revision);
            pushDomToast(t("admin.forms.topbar_logo_toast_saved"), "success");
          } else {
            pushDomToast(res.message, "error");
          }
        } catch {
          pushDomToast(t("admin.forms.conn_error"), "error");
        }
      });
    },
    [disabled, pending, t],
  );

  const onRemove = () => {
    if (disabled || pending) return;
    startTransition(async () => {
      pushDomToast(t("admin.forms.toast_saving"), "info");
      try {
        const res = await removeSystemTopbarLogoAction();
        if (res.ok) {
          setRevision(res.revision);
          pushDomToast(t("admin.forms.topbar_logo_toast_removed"), "success");
        } else {
          pushDomToast(res.message, "error");
        }
      } catch {
        pushDomToast(t("admin.forms.conn_error"), "error");
      }
    });
  };

  const previewSrc = buildPreviewUrl(revision);

  return (
    <div className="form-group admin-logo-upload-wrap">
      <span className="form-section-label" id="sys_topbar_logo_label">
        {t("admin.forms.section_topbar_logo")}
      </span>
      <p className="form-hint" style={{ marginTop: 4, marginBottom: 10 }}>
        {t("admin.forms.topbar_logo_hint")}
      </p>

      <div
        className={
          "admin-logo-dropzone admin-logo-dropzone--topbar" +
          (dragOver ? " is-dragover" : "") +
          (disabled || pending ? " is-disabled" : "")
        }
        role="button"
        tabIndex={disabled || pending ? -1 : 0}
        aria-labelledby="sys_topbar_logo_label"
        aria-disabled={disabled || pending}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled && !pending) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !pending) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled || pending) return;
          const file = e.dataTransfer.files?.[0];
          uploadFile(file);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => {
          if (!disabled && !pending) inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          name="topbar_logo"
          accept="image/png,image/jpeg,image/webp"
          className="admin-logo-file-input"
          disabled={disabled || pending}
          onChange={(e) => {
            uploadFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {hasLogo && previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt=""
            className="admin-logo-dropzone-preview admin-logo-dropzone-preview--topbar"
            width={120}
            height={36}
            aria-hidden="true"
          />
        ) : (
          <span className="admin-logo-dropzone-placeholder" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" focusable="false">
              <path
                fill="currentColor"
                d="M3 5h18v2H3V5zm0 6h12v2H3v-2zm0 6h18v2H3v-2z"
              />
            </svg>
          </span>
        )}
        <span className="admin-logo-dropzone-text">
          {pending
            ? t("admin.forms.toast_saving")
            : dragOver
              ? t("admin.forms.logo_drop_release")
              : t("admin.forms.topbar_logo_drop_idle")}
        </span>
        <span className="admin-logo-dropzone-meta">{t("admin.forms.topbar_logo_formats")}</span>
      </div>

      {hasLogo ? (
        <div className="admin-logo-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm admin-lang-btn-soft"
            disabled={disabled || pending}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            {t("admin.forms.topbar_logo_replace")}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm admin-lang-btn-soft"
            disabled={disabled || pending}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            {t("admin.forms.topbar_logo_remove")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

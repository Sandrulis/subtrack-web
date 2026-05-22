"use client";

import {
  removeSystemLogoAction,
  uploadSystemLogoAction,
} from "@/lib/admin/logo-actions";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { useCallback, useRef, useState, useTransition } from "react";

type AdminSystemLogoUploadProps = {
  initialLogoRevision: number;
  disabled?: boolean;
};

function buildPreviewUrl(revision: number): string | null {
  if (revision <= 0) return null;
  return `/brand/icon-64.png?v=${revision}`;
}

export function AdminSystemLogoUpload({
  initialLogoRevision,
  disabled = false,
}: AdminSystemLogoUploadProps) {
  const { t } = useSubtrackIntl();
  const [revision, setRevision] = useState(initialLogoRevision);
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
          const res = await uploadSystemLogoAction(fd);
          if (res.ok) {
            setRevision(res.revision);
            pushDomToast(t("admin.forms.logo_toast_saved"), "success");
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
        const res = await removeSystemLogoAction();
        if (res.ok) {
          setRevision(res.revision);
          pushDomToast(t("admin.forms.logo_toast_removed"), "success");
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
      <span className="form-section-label" id="sys_logo_label">
        {t("admin.forms.section_logo")}
      </span>
      <p className="form-hint" style={{ marginTop: 4, marginBottom: 10 }}>
        {t("admin.forms.logo_hint")}
      </p>

      <div
        className={
          "admin-logo-dropzone" +
          (dragOver ? " is-dragover" : "") +
          (disabled || pending ? " is-disabled" : "")
        }
        role="button"
        tabIndex={disabled || pending ? -1 : 0}
        aria-labelledby="sys_logo_label"
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
          name="logo"
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
            className="admin-logo-dropzone-preview"
            width={64}
            height={64}
            aria-hidden="true"
          />
        ) : (
          <span className="admin-logo-dropzone-placeholder" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" focusable="false">
              <path
                fill="currentColor"
                d="M19 7v2.99s-1-.01-2-.01V7h-3s.01-1 .01-2H17V2h2v3.99L19 6c1.1 0 2 .9 2 2zm-2 4V9h-2v2.01h2zm-6 2.01V9H9v4.01h2zM7 9.01V7H5v2.01h2zM5 13.01v2H3v-2.01h2zm12 0v2.01h-2V13h2zM11 17.01V19H9v-2.01h2zm-6 0V19H3v-2.01h2zM3 7.01V5h2.01L5 7H3zm12 6.99h2.01V17H15v-3z"
              />
            </svg>
          </span>
        )}
        <span className="admin-logo-dropzone-text">
          {pending
            ? t("admin.forms.hud_saving")
            : dragOver
              ? t("admin.forms.logo_drop_release")
              : t("admin.forms.logo_drop_idle")}
        </span>
        <span className="admin-logo-dropzone-meta">{t("admin.forms.logo_formats")}</span>
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
            {t("admin.forms.logo_replace")}
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
            {t("admin.forms.logo_remove")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

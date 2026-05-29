"use client";

import Link from "next/link";
import {
  createBlogPostAction,
  deleteBlogPostAction,
  setBlogPostPublishedAction,
  updateBlogPostAction,
  type BlogActionResult,
} from "@/lib/admin/blog-actions";
import { uploadBlogImageAction } from "@/lib/admin/blog-image-actions";
import type { AdminBlogPostRow } from "@/lib/blog/blog-types";
import { titleToBlogSlug } from "@/lib/blog/slug";
import { BlogBbcodeContent } from "@/components/blog/blog-bbcode-content";
import { AdminBlogIntro } from "@/components/admin/admin-intros";
import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { handleModalBackdropMouseDown } from "@/lib/ui/modal-overlay-guard";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";

type AdminBlogPanelProps = {
  initialRows: AdminBlogPostRow[];
  loadError: string | null;
};

type EditorState = {
  mode: "create" | "edit";
  id?: string;
  title: string;
  excerpt: string;
  body_bbcode: string;
  is_published: boolean;
};

const BB_TOOLBAR: { tag: string; labelKey: string; wrap?: [string, string] }[] = [
  { tag: "b", labelKey: "admin.blog.toolbar.bold", wrap: ["[b]", "[/b]"] },
  { tag: "i", labelKey: "admin.blog.toolbar.italic", wrap: ["[i]", "[/i]"] },
  { tag: "u", labelKey: "admin.blog.toolbar.underline", wrap: ["[u]", "[/u]"] },
  { tag: "url", labelKey: "admin.blog.toolbar.link", wrap: ['[url="https://"]', "[/url]"] },
  { tag: "img", labelKey: "admin.blog.toolbar.image", wrap: ["[img]", "[/img]"] },
  { tag: "youtube", labelKey: "admin.blog.toolbar.youtube", wrap: ["[youtube]", "[/youtube]"] },
  { tag: "quote", labelKey: "admin.blog.toolbar.quote", wrap: ["[quote]", "[/quote]"] },
  { tag: "code", labelKey: "admin.blog.toolbar.code", wrap: ["[code]", "[/code]"] },
];

function actionToast(result: BlogActionResult, t: (k: string) => string) {
  if (result.ok) {
    pushDomToast(t("admin.blog.toast.saved"), "success");
  } else {
    pushDomToast(result.message, "error");
  }
}

function IconPlus() {
  return (
    <svg className="admin-btn-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg className="admin-btn-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="admin-btn-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  );
}

function PublishedSwitch({
  checked,
  disabled,
  onCheckedChange,
  labelId,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  labelId: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      className={`admin-switch${checked ? " is-on" : ""}`}
      aria-checked={checked}
      aria-labelledby={labelId}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="admin-switch-track" aria-hidden />
      <span className="admin-switch-thumb" aria-hidden />
    </button>
  );
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
): string {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const selected = textarea.value.slice(start, end);
  const next = textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
  const cursor = start + before.length + selected.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
  });
  return next;
}

export function AdminBlogPanel({ initialRows, loadError }: AdminBlogPanelProps) {
  const { t, locale } = useSubtrackIntl();
  const router = useRouter();
  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);
  const [pending, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const formId = useId();

  const formatDate = useCallback(
    (iso: string | null) => {
      if (!iso) return "\u2014";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return new Intl.DateTimeFormat(intlLocale, { dateStyle: "short", timeStyle: "short" }).format(
        d,
      );
    },
    [intlLocale],
  );

  const publishedLabelId = `${formId}-published-label`;

  const openCreate = () => {
    setEditor({
      mode: "create",
      title: "",
      excerpt: "",
      body_bbcode: "",
      is_published: false,
    });
    setPreview(false);
    setEditorOpen(true);
  };

  const openEdit = (row: AdminBlogPostRow) => {
    setEditor({
      mode: "edit",
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      body_bbcode: row.body_bbcode,
      is_published: row.is_published,
    });
    setPreview(false);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditor(null);
    setPreview(false);
  };

  useEffect(() => {
    if (!editorOpen || pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditor();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorOpen, pending]);

  const wrapBody = (before: string, after: string) => {
    const ta = bodyRef.current;
    if (!ta || !editor) return;
    const nextBody = insertAtCursor(ta, before, after);
    setEditor({ ...editor, body_bbcode: nextBody });
  };

  const onUploadImage = (file: File | null | undefined) => {
    if (!file || !editor || pending) return;
    const fd = new FormData();
    fd.set("image", file);
    startTransition(async () => {
      pushDomToast(t("admin.blog.toast.uploading"), "info");
      try {
        const res = await uploadBlogImageAction(fd);
        if (!res.ok) {
          pushDomToast(res.message, "error");
          return;
        }
        const ta = bodyRef.current;
        if (ta) {
          const nextBody = insertAtCursor(ta, `${res.bbcode}\n`, "");
          setEditor((prev) => (prev ? { ...prev, body_bbcode: nextBody } : prev));
        } else {
          setEditor((prev) =>
            prev ? { ...prev, body_bbcode: `${prev.body_bbcode}\n${res.bbcode}\n` } : prev,
          );
        }
        pushDomToast(t("admin.blog.toast.image_uploaded"), "success");
      } catch {
        pushDomToast(t("admin.forms.conn_error"), "error");
      }
    });
  };

  const submitEditor = () => {
    if (!editor || pending) return;
    const fd = new FormData();
    if (editor.mode === "edit" && editor.id) fd.set("id", editor.id);
    fd.set("title", editor.title);
    fd.set("excerpt", editor.excerpt);
    fd.set("body_bbcode", editor.body_bbcode);
    if (editor.is_published) fd.set("is_published", "1");

    startTransition(async () => {
      pushDomToast(t("admin.forms.toast_saving"), "info");
      try {
        const res =
          editor.mode === "create"
            ? await createBlogPostAction(fd)
            : await updateBlogPostAction(fd);
        actionToast(res, t);
        if (res.ok) {
          closeEditor();
          router.refresh();
        }
      } catch {
        pushDomToast(t("admin.forms.conn_error"), "error");
      }
    });
  };

  const togglePublished = (row: AdminBlogPostRow) => {
    if (pending) return;
    const fd = new FormData();
    fd.set("id", row.id);
    if (!row.is_published) fd.set("is_published", "1");
    startTransition(async () => {
      const res = await setBlogPostPublishedAction(fd);
      actionToast(res, t);
      if (res.ok) router.refresh();
    });
  };

  const confirmDelete = (row: AdminBlogPostRow) => {
    if (pending) return;
    if (!window.confirm(t("admin.blog.confirm_delete"))) return;
    const fd = new FormData();
    fd.set("id", row.id);
    startTransition(async () => {
      const res = await deleteBlogPostAction(fd);
      actionToast(res, t);
      if (res.ok) router.refresh();
    });
  };

  return (
    <div className="admin-lang-stack admin-blog-panel">
      <AdminBlogIntro
        titleActions={
          <button
            type="button"
            className="btn btn-primary admin-lang-add-btn"
            disabled={pending || !!loadError}
            onClick={openCreate}
          >
            <IconPlus />
            {t("admin.blog.btn_add")}
          </button>
        }
      />

      {loadError ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {loadError}
        </div>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("admin.blog.col.title")}</th>
              <th>{t("admin.blog.col.slug")}</th>
              <th>{t("admin.blog.col.status")}</th>
              <th>{t("admin.blog.col.updated")}</th>
              <th aria-label={t("admin.blog.col.actions")} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  {t("admin.blog.empty")}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="admin-blog-title-cell">{row.title}</span>
                    {row.is_published ? (
                      <Link
                        href={`/blog/${row.slug}`}
                        className="admin-blog-public-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("admin.blog.view_public")}
                      </Link>
                    ) : null}
                  </td>
                  <td>
                    <code className="admin-inline-code">/blog/{row.slug}</code>
                  </td>
                  <td>
                    <span
                      className={
                        "admin-badge" + (row.is_published ? " admin-badge--admin" : "")
                      }
                    >
                      {row.is_published
                        ? t("admin.blog.status.published")
                        : t("admin.blog.status.draft")}
                    </span>
                  </td>
                  <td>{formatDate(row.updated_at)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <SubtrackTooltip label={t("admin.blog.action.edit")}>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          disabled={pending}
                          onClick={() => openEdit(row)}
                          aria-label={t("admin.blog.action.edit")}
                        >
                          <IconPencil />
                        </button>
                      </SubtrackTooltip>
                      <SubtrackTooltip
                        label={
                          row.is_published
                            ? t("admin.blog.action.unpublish")
                            : t("admin.blog.action.publish")
                        }
                      >
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--save"
                          disabled={pending}
                          onClick={() => togglePublished(row)}
                          aria-label={
                            row.is_published
                              ? t("admin.blog.action.unpublish")
                              : t("admin.blog.action.publish")
                          }
                        >
                          {row.is_published ? "\u2715" : "\u2713"}
                        </button>
                      </SubtrackTooltip>
                      <SubtrackTooltip label={t("admin.blog.action.delete")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--danger"
                          disabled={pending}
                          onClick={() => confirmDelete(row)}
                          aria-label={t("admin.blog.action.delete")}
                        >
                          <IconTrash />
                        </button>
                      </SubtrackTooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editorOpen && editor ? (
        <div
          className="modal-overlay modal-backdrop-close-confirm-overlay open"
          role="presentation"
          onMouseDown={(e) =>
            handleModalBackdropMouseDown(e, () => {
              if (!pending) closeEditor();
            }, {
              busy: pending,
              confirmMessage: t("ui.modal.confirm_close_backdrop"),
            })
          }
        >
          <div
            className="modal modal--wide admin-i18n-modal admin-blog-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${formId}-title`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id={`${formId}-title`}>
                {editor.mode === "create"
                  ? t("admin.blog.modal.create")
                  : t("admin.blog.modal.edit")}
              </h2>
              <button
                type="button"
                className="modal-close"
                disabled={pending}
                onClick={closeEditor}
                aria-label={t("admin.translations_panel.aria_close_modal")}
              >
                ×
              </button>
            </div>
            <div className="modal-body admin-blog-modal-body">
              <div className="form-group">
                <label htmlFor={`${formId}-title-input`}>{t("admin.blog.field.title")}</label>
                <input
                  id={`${formId}-title-input`}
                  type="text"
                  className="form-control"
                  value={editor.title}
                  disabled={pending}
                  onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                />
                {editor.title.trim() ? (
                  <p className="form-hint admin-blog-url-preview">
                    {t("admin.blog.field.url_preview")}{" "}
                    <code className="admin-inline-code">
                      /blog/{titleToBlogSlug(editor.title)}
                    </code>
                  </p>
                ) : (
                  <p className="form-hint">{t("admin.blog.field.slug_hint")}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={`${formId}-excerpt`}>{t("admin.blog.field.excerpt")}</label>
                <textarea
                  id={`${formId}-excerpt`}
                  className="form-control"
                  rows={2}
                  value={editor.excerpt}
                  disabled={pending}
                  onChange={(e) => setEditor({ ...editor, excerpt: e.target.value })}
                />
              </div>
              <div className="form-group">
                <div className="admin-blog-editor-head">
                  <label htmlFor={`${formId}-body`}>{t("admin.blog.field.body")}</label>
                  <div className="admin-blog-editor-tabs">
                    <button
                      type="button"
                      className={"admin-blog-tab" + (!preview ? " is-active" : "")}
                      disabled={pending}
                      onClick={() => setPreview(false)}
                    >
                      {t("admin.blog.tab.edit")}
                    </button>
                    <button
                      type="button"
                      className={"admin-blog-tab" + (preview ? " is-active" : "")}
                      disabled={pending}
                      onClick={() => setPreview(true)}
                    >
                      {t("admin.blog.tab.preview")}
                    </button>
                  </div>
                </div>
                {!preview ? (
                  <>
                    <div className="admin-blog-toolbar" role="toolbar" aria-label={t("admin.blog.toolbar.aria")}>
                      {BB_TOOLBAR.map((item) => (
                        <button
                          key={item.tag}
                          type="button"
                          className="btn btn-outline btn-sm admin-lang-btn-soft"
                          disabled={pending}
                          onClick={() => {
                            if (item.wrap) wrapBody(item.wrap[0], item.wrap[1]);
                          }}
                        >
                          {t(item.labelKey)}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline btn-sm admin-lang-btn-soft"
                        disabled={pending}
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {t("admin.blog.toolbar.upload")}
                      </button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        onChange={(e) => {
                          onUploadImage(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <textarea
                      ref={bodyRef}
                      id={`${formId}-body`}
                      className="form-control admin-blog-textarea"
                      rows={14}
                      value={editor.body_bbcode}
                      disabled={pending}
                      onChange={(e) => setEditor({ ...editor, body_bbcode: e.target.value })}
                    />
                    <p className="form-hint">{t("admin.blog.field.body_hint")}</p>
                  </>
                ) : (
                  <div className="admin-blog-preview auth-card auth-card--legal">
                    <BlogBbcodeContent bbcode={editor.body_bbcode} />
                  </div>
                )}
              </div>
              <div className="form-group admin-blog-published-row">
                <PublishedSwitch
                  checked={editor.is_published}
                  disabled={pending}
                  labelId={publishedLabelId}
                  onCheckedChange={(is_published) =>
                    setEditor({ ...editor, is_published })
                  }
                />
                <span id={publishedLabelId} className="admin-blog-published-label">
                  {t("admin.blog.field.published")}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" disabled={pending} onClick={closeEditor}>
                {t("admin.translations_panel.aria_cancel_row")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={pending}
                onClick={submitEditor}
              >
                {t("admin.translations_panel.aria_save_row")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

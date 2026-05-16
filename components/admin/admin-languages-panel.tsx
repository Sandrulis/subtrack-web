"use client";

import {
  createLanguageAction,
  deleteLanguageAction,
  setDefaultLanguageAction,
  updateLanguageAction,
  type LanguagesActionResult,
} from "@/lib/admin/languages-actions";
import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { useMemo, useState, useTransition } from "react";

export type AdminLanguageRow = {
  id: string;
  code: string;
  label: string;
  sort_order: number;
  updated_at: string;
  is_default: boolean;
};

type AdminLanguagesPanelProps = {
  rows: AdminLanguageRow[];
  loadError: string | null;
};

function formatIntlDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(d);
}

function IconPlus() {
  return (
    <svg
      className="admin-btn-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function IconPencil() {
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
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
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

function IconCheck() {
  return (
    <svg
      className="admin-btn-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function IconStarFilled() {
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
        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
}

function IconStarOutline() {
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
        d="m22 9.24-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"
      />
    </svg>
  );
}

function IconClose() {
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
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />
    </svg>
  );
}

export function AdminLanguagesPanel({
  rows,
  loadError,
}: AdminLanguagesPanelProps) {
  const { t, locale } = useSubtrackIntl();
  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");

  function applyResult(okMsg: string, res: LanguagesActionResult) {
    if (res.ok) {
      pushDomToast(okMsg, "success");
      return true;
    }
    pushDomToast(res.message, "error");
    return false;
  }

  return (
    <div className="admin-lang-stack">
      {loadError ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {t("admin.languages_panel.load_error_intro")} {loadError}.
          {t("admin.languages_panel.load_error_migration")}{" "}
          <code className="admin-inline-code">database/supabase/007_languages.sql</code>,{" "}
          <code className="admin-inline-code">
            database/supabase/010_languages_is_default_anon_select.sql
          </code>{" "}
          {t("admin.languages_panel.load_error_supabase_hint")}{" "}
          <code className="admin-inline-code">public.languages</code>
          {t("admin.languages_panel.load_error_suffix")}
        </div>
      ) : null}

      <div className="admin-lang-card">
        <p className="admin-lang-card-title">{t("admin.languages_panel.new_language_title")}</p>
        <div className="admin-lang-new-form">
          <div className="admin-lang-new-row">
            <div className="form-group admin-lang-field-code">
              <label htmlFor="new_lang_code">{t("admin.languages_panel.label_code")}</label>
              <input
                id="new_lang_code"
                type="text"
                placeholder={t("admin.languages_panel.placeholder_code")}
                autoComplete="off"
                value={newCode}
                disabled={busy}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className="form-group admin-lang-field-label">
              <label htmlFor="new_lang_label">{t("admin.languages_panel.label_ui_name")}</label>
              <input
                id="new_lang_label"
                type="text"
                placeholder={t("admin.languages_panel.placeholder_ui_name")}
                autoComplete="off"
                value={newLabel}
                disabled={busy}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm admin-lang-add-btn"
              disabled={busy || loadError !== null}
              onClick={() => {
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("code", newCode);
                  fd.set("label", newLabel);
                  fd.set("sort_order", "0");
                  const res = await createLanguageAction(fd);
                  if (applyResult(t("admin.languages_panel.toast_added"), res)) {
                    setNewCode("");
                    setNewLabel("");
                  }
                });
              }}
            >
              <IconPlus />
              {t("admin.languages_panel.add_btn")}
            </button>
          </div>
          <p className="admin-lang-new-hints" aria-live="polite">
            {t("admin.languages_panel.hints_line")}
          </p>
        </div>
      </div>

      {rows.length === 0 && !loadError ? (
        <p className="admin-empty">{t("admin.languages_panel.empty_catalog")}</p>
      ) : !loadError && rows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--languages">
            <colgroup>
              <col className="admin-table-col-code" />
              <col className="admin-table-col-label" />
              <col className="admin-table-col-datetime" />
              <col className="admin-table-col-default" />
              <col className="admin-table-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{t("admin.languages_panel.th_code")}</th>
                <th scope="col">{t("admin.languages_panel.th_name")}</th>
                <th scope="col" className="admin-table-col-datetime-head">
                  {t("admin.languages_panel.th_updated")}
                </th>
                <th scope="col" className="admin-table-col-default-head">
                  <SubtrackTooltip label={t("admin.languages_panel.default_head_title")}>
                    <span>{t("admin.languages_panel.th_default_abbr")}</span>
                  </SubtrackTooltip>
                </th>
                <th
                  scope="col"
                  className="admin-table-col-actions-head"
                  aria-label={t("admin.languages_panel.aria_actions")}
                />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
                editingId === row.id ? (
                  <EditLanguageRow
                    key={row.id}
                    row={row}
                    busy={busy}
                    onCancel={() => setEditingId(null)}
                    onSave={(payload) => {
                      startTransition(async () => {
                        const fd = new FormData();
                        fd.set("id", row.id);
                        fd.set("code", payload.code);
                        fd.set("label", payload.label);
                        fd.set("sort_order", String(row.sort_order));
                        const res = await updateLanguageAction(fd);
                        if (applyResult(t("admin.languages_panel.toast_saved"), res)) {
                          setEditingId(null);
                        }
                      });
                    }}
                  />
                ) : (
                  <tr key={row.id}>
                    <td>
                      <code className="admin-inline-code">{row.code}</code>
                    </td>
                    <td>{row.label}</td>
                    <td className="admin-table-col-datetime-cell">
                      {formatIntlDateTime(row.updated_at, intlLocale)}
                    </td>
                    <td className="admin-table-col-default-cell">
                      {row.is_default ? (
                        <SubtrackTooltip label={t("admin.languages_panel.badge_default_aria")}>
                          <span
                            className="admin-lang-default-star is-active"
                            role="img"
                            aria-label={t("admin.languages_panel.badge_default_aria")}
                          >
                            <IconStarFilled />
                          </span>
                        </SubtrackTooltip>
                      ) : (
                        <SubtrackTooltip label={t("admin.languages_panel.btn_make_default_title")}>
                          <button
                            type="button"
                            className="admin-icon-btn admin-icon-btn--neutral"
                            disabled={busy}
                            aria-label={t("admin.languages_panel.btn_make_default_aria")}
                            onClick={() => {
                              startTransition(async () => {
                                const fd = new FormData();
                                fd.set("id", row.id);
                                const res = await setDefaultLanguageAction(fd);
                                applyResult(
                                  t("admin.languages_panel.toast_default_updated"),
                                  res,
                                );
                              });
                            }}
                          >
                            <IconStarOutline />
                          </button>
                        </SubtrackTooltip>
                      )}
                    </td>
                    <td className="admin-actions-cell">
                      <SubtrackTooltip label={t("admin.languages_panel.aria_edit")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--edit"
                          disabled={busy}
                          aria-label={t("admin.languages_panel.aria_edit")}
                          onClick={() => {
                            setEditingId(row.id);
                          }}
                        >
                          <IconPencil />
                        </button>
                      </SubtrackTooltip>
                      <SubtrackTooltip label={t("admin.languages_panel.aria_delete_language")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--delete"
                          disabled={busy}
                          aria-label={t("admin.languages_panel.aria_delete_language")}
                          onClick={() => {
                            const msg = t("admin.languages_panel.confirm_delete_language")
                              .replace(/\{label\}/g, row.label)
                              .replace(/\{code\}/g, row.code);
                            if (typeof window !== "undefined" && !window.confirm(msg)) {
                              return;
                            }
                            startTransition(async () => {
                              const fd = new FormData();
                              fd.set("id", row.id);
                              const res = await deleteLanguageAction(fd);
                              applyResult(t("admin.languages_panel.toast_deleted"), res);
                              if (res.ok) setEditingId(null);
                            });
                          }}
                        >
                          <IconTrash />
                        </button>
                      </SubtrackTooltip>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function EditLanguageRow({
  row,
  busy,
  onCancel,
  onSave,
}: {
  row: AdminLanguageRow;
  busy: boolean;
  onCancel: () => void;
  onSave: (payload: { code: string; label: string }) => void;
}) {
  const { t } = useSubtrackIntl();
  const [code, setCode] = useState(row.code);
  const [label, setLabel] = useState(row.label);

  return (
    <tr>
      <td colSpan={5}>
        <div className="admin-lang-edit admin-lang-edit--inline">
          <div className="admin-lang-edit-row">
            <div className="form-group admin-lang-field-code">
              <label htmlFor={`code-${row.id}`}>{t("admin.languages_panel.label_code")}</label>
              <input
                id={`code-${row.id}`}
                type="text"
                value={code}
                disabled={busy}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="form-group admin-lang-field-label-wide">
              <label htmlFor={`label-${row.id}`}>{t("admin.languages_panel.th_name")}</label>
              <input
                id={`label-${row.id}`}
                type="text"
                value={label}
                disabled={busy}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="admin-lang-edit-actions">
              <SubtrackTooltip label={t("admin.languages_panel.aria_save_edit")}>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--save"
                  disabled={busy}
                  aria-label={t("admin.languages_panel.aria_save_edit")}
                  onClick={() => onSave({ code, label })}
                >
                  <IconCheck />
                </button>
              </SubtrackTooltip>
              <SubtrackTooltip label={t("admin.languages_panel.aria_cancel_edit")}>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--neutral"
                  disabled={busy}
                  aria-label={t("admin.languages_panel.aria_cancel_edit")}
                  onClick={onCancel}
                >
                  <IconClose />
                </button>
              </SubtrackTooltip>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

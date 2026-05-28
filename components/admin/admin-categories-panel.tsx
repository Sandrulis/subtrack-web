"use client";

import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoriesAction,
  setCategoryEnabledAction,
  updateCategoryAction,
  type CategoriesActionResult,
} from "@/lib/admin/categories-actions";
import type { AdminCategoryRow } from "@/lib/admin/admin-categories-data";
import type { TranslationLanguageColumn } from "@/lib/admin/admin-translations-data";
import { categoryTranslationKey } from "@/lib/admin/category-translation";
import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { handleModalBackdropMouseDown } from "@/lib/ui/modal-overlay-guard";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { useEffect, useId, useMemo, useState, useTransition } from "react";

type AdminCategoriesPanelProps = {
  rows: AdminCategoryRow[];
  languages: TranslationLanguageColumn[];
  defaultLocaleCode: string;
  loadError: string | null;
};

function formatIntlDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(d);
}

function localesRecordFromMap(
  map: Record<string, string>,
  codes: string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of codes) out[c] = map[c] ?? "";
  return out;
}

function emptyLocalesRecord(codes: string[]): Record<string, string> {
  return localesRecordFromMap({}, codes);
}

function resolveCategoryDisplayLabel(
  row: AdminCategoryRow,
  uiLocale: string,
  defaultLocaleCode: string,
): string {
  const loc = uiLocale.trim().toLowerCase();
  const def = defaultLocaleCode.trim().toLowerCase();
  const fromUi = (row.translationsByLocale[loc] ?? "").trim();
  if (fromUi) return fromUi;
  const fromDef = (row.translationsByLocale[def] ?? "").trim();
  if (fromDef) return fromDef;
  for (const value of Object.values(row.translationsByLocale)) {
    const t = String(value ?? "").trim();
    if (t) return t;
  }
  return row.label;
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

function IconDragHandle() {
  return (
    <svg
      className="admin-categories-drag-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
      />
    </svg>
  );
}

function CategorySwitch({
  checked,
  disabled,
  onCheckedChange,
  ariaLabelledBy,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  ariaLabelledBy?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      className={`admin-switch${checked ? " is-on" : ""}`}
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="admin-switch-track" aria-hidden />
      <span className="admin-switch-thumb" aria-hidden />
    </button>
  );
}

function CategoryLocaleFields({
  languages,
  valuesByLocale,
  disabled,
  onChange,
  idsPrefix,
  placeholder,
}: {
  languages: TranslationLanguageColumn[];
  valuesByLocale: Record<string, string>;
  disabled: boolean;
  onChange: (code: string, value: string) => void;
  idsPrefix: string;
  placeholder: string;
}) {
  return (
    <div className="admin-i18n-locale-grid">
      {languages.map((lang) => {
        const code = lang.code.trim().toLowerCase();
        return (
          <div key={code} className="form-group admin-i18n-locale-field">
            <label htmlFor={`${idsPrefix}_${code}`}>
              {lang.label} <span className="admin-i18n-code">({code})</span>
            </label>
            <textarea
              id={`${idsPrefix}_${code}`}
              rows={3}
              placeholder={placeholder}
              value={valuesByLocale[code] ?? ""}
              disabled={disabled}
              onChange={(e) => onChange(code, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}

function AdminCategoryEditModal({
  open,
  row,
  languages,
  valuesByLocale,
  busy,
  onClose,
  onSave,
  onChange,
}: {
  open: boolean;
  row: AdminCategoryRow | null;
  languages: TranslationLanguageColumn[];
  valuesByLocale: Record<string, string>;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (code: string, value: string) => void;
}) {
  const titleId = useId();
  const { t } = useSubtrackIntl();
  const localePlaceholder = t("admin.translations_panel.placeholder_locale_value");

  useEffect(() => {
    if (!open || busy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open || !row) return null;

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
        className="modal modal--wide admin-i18n-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId}>{t("admin.categories_panel.modal_edit_title")}</h2>
          <button
            type="button"
            className="modal-close"
            disabled={busy}
            aria-label={t("admin.translations_panel.aria_close_modal")}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal-body admin-i18n-stack">
          <div className="admin-i18n-modal-form">
            <p className="admin-i18n-edit-key admin-i18n-edit-key--modal">
              {t("admin.categories_panel.label_key")}{" "}
              <code className="admin-inline-code">{row.category_key}</code>
              <span className="admin-inline-meta">
                {" "}
                · {categoryTranslationKey(row.category_key)}
              </span>
            </p>
            <CategoryLocaleFields
              languages={languages}
              valuesByLocale={valuesByLocale}
              disabled={busy}
              idsPrefix={`edit_cat_${row.id}`}
              placeholder={localePlaceholder}
              onChange={onChange}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
            {t("admin.translations_panel.aria_cancel_row")}
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onSave}>
            {t("admin.translations_panel.aria_save_row")}
          </button>
        </div>
      </div>
    </div>
  );
}

function applyRowReorder(
  rows: AdminCategoryRow[],
  draggedId: string,
  beforeId: string | null,
): AdminCategoryRow[] {
  const dragged = rows.find((r) => r.id === draggedId);
  if (!dragged) return rows;
  const without = rows.filter((r) => r.id !== draggedId);
  if (!beforeId) return [...without, dragged];
  const idx = without.findIndex((r) => r.id === beforeId);
  if (idx < 0) return [...without, dragged];
  const next = [...without];
  next.splice(idx, 0, dragged);
  return next;
}

export function AdminCategoriesPanel({
  rows,
  languages,
  defaultLocaleCode,
  loadError,
}: AdminCategoriesPanelProps) {
  const { t, locale } = useSubtrackIntl();
  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);

  const codes = useMemo(
    () => languages.map((l) => l.code.trim().toLowerCase()).filter(Boolean),
    [languages],
  );

  const languagesSorted = useMemo(() => {
    const collator = new Intl.Collator(intlLocale, { sensitivity: "base" });
    return [...languages].sort((a, b) => collator.compare(a.label, b.label));
  }, [languages, intlLocale]);

  const [orderedRows, setOrderedRows] = useState(rows);
  const [editRow, setEditRow] = useState<AdminCategoryRow | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [busy, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropBeforeId, setDropBeforeId] = useState<string | null>(null);

  const [newKey, setNewKey] = useState("");
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [newEnabled, setNewEnabled] = useState(true);

  useEffect(() => {
    setOrderedRows(rows);
  }, [rows]);

  useEffect(() => {
    setNewValues(emptyLocalesRecord(codes));
  }, [codes]);

  const showNewTranslations = newKey.trim().length >= 2;
  const dragDisabled = busy || loadError !== null || editRow !== null;

  function applyResult(okMsg: string, res: CategoriesActionResult) {
    if (res.ok) {
      pushDomToast(okMsg, "success");
      return true;
    }
    pushDomToast(res.message, "error");
    return false;
  }

  function clearDragState() {
    setDraggingId(null);
    setDropBeforeId(null);
  }

  function persistReorder(nextRows: AdminCategoryRow[]) {
    const ids = nextRows.map((r) => r.id);
    startTransition(async () => {
      const res = await reorderCategoriesAction(ids);
      if (!res.ok) {
        setOrderedRows(rows);
        pushDomToast(res.message, "error");
        return;
      }
      pushDomToast(t("admin.categories_panel.toast_reordered"), "success");
    });
  }

  function handleDropOnRow(draggedId: string, beforeId: string | null) {
    if (!draggedId || draggedId === beforeId) {
      clearDragState();
      return;
    }
    const next = applyRowReorder(orderedRows, draggedId, beforeId);
    setOrderedRows(next);
    clearDragState();
    persistReorder(next);
  }

  function openEdit(row: AdminCategoryRow) {
    setEditRow(row);
    setEditValues(localesRecordFromMap(row.translationsByLocale, codes));
  }

  function submitCreate() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("category_key", newKey);
      fd.set("enabled", newEnabled ? "true" : "false");
      fd.set("values_json", JSON.stringify(localesRecordFromMap(newValues, codes)));
      const res = await createCategoryAction(fd);
      if (applyResult(t("admin.categories_panel.toast_added"), res)) {
        setNewKey("");
        setNewValues(emptyLocalesRecord(codes));
        setNewEnabled(true);
      }
    });
  }

  function submitEdit() {
    if (!editRow) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", editRow.id);
      fd.set("values_json", JSON.stringify(localesRecordFromMap(editValues, codes)));
      const res = await updateCategoryAction(fd);
      if (applyResult(t("admin.categories_panel.toast_saved"), res)) {
        setEditRow(null);
      }
    });
  }

  const localePlaceholder = t("admin.translations_panel.placeholder_locale_value");

  return (
    <div className="admin-lang-stack">
      {loadError ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {t("admin.categories_panel.load_error_intro")} {loadError}.{" "}
          {t("admin.categories_panel.load_error_migration")}{" "}
          <code className="admin-inline-code">database/supabase/131_subscription_categories.sql</code>{" "}
          {t("admin.categories_panel.load_error_hint_code")}{" "}
          <code className="admin-inline-code">public.subscription_categories</code>
          {t("admin.categories_panel.load_error_suffix")}
        </div>
      ) : null}

      {!loadError && languages.length === 0 ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {t("admin.translations_panel.no_languages_alert")}
        </div>
      ) : null}

      <div className="admin-lang-card">
        <p className="admin-lang-card-title">{t("admin.categories_panel.new_title")}</p>
        <div className="admin-lang-new-form">
          <div className="admin-lang-new-row admin-lang-new-row--integrations">
            <div className="form-group admin-lang-field-code admin-i18n-key-field">
              <label htmlFor="new_category_key">{t("admin.categories_panel.label_key")}</label>
              <input
                id="new_category_key"
                type="text"
                placeholder={t("admin.categories_panel.placeholder_key")}
                autoComplete="off"
                value={newKey}
                disabled={busy}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="form-group admin-integration-switch-field">
              <span
                className="admin-integration-switch-caption"
                id="new_category_enabled_caption"
              >
                {t("admin.categories_panel.label_enabled")}
              </span>
              <CategorySwitch
                checked={newEnabled}
                disabled={busy || loadError !== null}
                onCheckedChange={setNewEnabled}
                ariaLabelledBy="new_category_enabled_caption"
              />
            </div>
          </div>

          {showNewTranslations ? (
            <div className="admin-i18n-stack admin-i18n-new">
              <p className="admin-i18n-search-scope-hint">
                {t("admin.categories_panel.translations_hint").replace(
                  /\{code\}/g,
                  defaultLocaleCode,
                )}
              </p>
              <CategoryLocaleFields
                languages={languagesSorted}
                valuesByLocale={localesRecordFromMap(newValues, codes)}
                disabled={busy || loadError !== null}
                idsPrefix="new_cat_tr"
                placeholder={localePlaceholder}
                onChange={(code, value) =>
                  setNewValues((prev) => ({ ...prev, [code]: value }))
                }
              />
              <div className="admin-i18n-actions-row">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={busy || loadError !== null || languages.length === 0}
                  onClick={submitCreate}
                >
                  <IconPlus />
                  {t("admin.categories_panel.add_btn")}
                </button>
              </div>
            </div>
          ) : (
            <p className="admin-i18n-search-scope-hint admin-categories-key-hint">
              {t("admin.categories_panel.translations_after_key_hint")}
            </p>
          )}
        </div>
      </div>

      <AdminCategoryEditModal
        open={editRow !== null}
        row={editRow}
        languages={languagesSorted}
        valuesByLocale={editValues}
        busy={busy}
        onClose={() => !busy && setEditRow(null)}
        onSave={submitEdit}
        onChange={(code, value) => setEditValues((prev) => ({ ...prev, [code]: value }))}
      />

      {orderedRows.length === 0 && !loadError ? (
        <p className="admin-empty">{t("admin.categories_panel.empty")}</p>
      ) : !loadError && orderedRows.length > 0 ? (
        <>
          <p className="admin-categories-drag-hint">{t("admin.categories_panel.hint_drag_reorder")}</p>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--languages admin-table--categories">
              <colgroup>
                <col className="admin-table-col-drag" />
                <col className="admin-table-col-code" />
                <col className="admin-table-col-label" />
                <col />
                <col className="admin-table-col-datetime" />
                <col className="admin-table-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="admin-table-col-drag-head"
                    aria-label={t("admin.categories_panel.drag_handle_aria")}
                  />
                  <th scope="col">{t("admin.categories_panel.th_key")}</th>
                  <th scope="col">{t("admin.categories_panel.th_name")}</th>
                  <th scope="col">{t("admin.categories_panel.th_enabled")}</th>
                  <th scope="col" className="admin-table-col-datetime-head">
                    {t("admin.categories_panel.th_updated")}
                  </th>
                  <th
                    scope="col"
                    className="admin-table-col-actions-head"
                    aria-label={t("admin.categories_panel.aria_actions")}
                  />
                </tr>
              </thead>
              <tbody>
                {orderedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      "admin-categories-row" +
                      (draggingId === row.id ? " admin-categories-row--dragging" : "") +
                      (dropBeforeId === row.id ? " admin-categories-row--drop-before" : "")
                    }
                    onDragOver={(e) => {
                      if (!draggingId || draggingId === row.id) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDropBeforeId(row.id);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      if (dropBeforeId === row.id) setDropBeforeId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("text/plain") || draggingId || "";
                      handleDropOnRow(id, row.id);
                    }}
                  >
                    <td className="admin-categories-drag-cell">
                      <button
                        type="button"
                        className="admin-categories-drag-handle"
                        draggable={!dragDisabled}
                        disabled={dragDisabled}
                        aria-label={t("admin.categories_panel.drag_handle_aria")}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", row.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(row.id);
                        }}
                        onDragEnd={clearDragState}
                      >
                        <IconDragHandle />
                      </button>
                    </td>
                    <td>
                      <code className="admin-inline-code">{row.category_key}</code>
                    </td>
                    <td>
                      {resolveCategoryDisplayLabel(row, locale, defaultLocaleCode)}
                      {(row.usage_count ?? 0) > 0 ? (
                        <span className="admin-inline-meta">
                          {" "}
                          ({t("admin.categories_panel.usage_count_abbr")} {row.usage_count})
                        </span>
                      ) : null}
                    </td>
                    <td className="admin-integration-enabled-cell">
                      <SubtrackTooltip
                        label={
                          row.enabled
                            ? t("admin.categories_panel.state_on")
                            : t("admin.categories_panel.state_off")
                        }
                      >
                        <CategorySwitch
                          checked={row.enabled}
                          disabled={busy}
                          onCheckedChange={(next) => {
                            startTransition(async () => {
                              const fd = new FormData();
                              fd.set("id", row.id);
                              fd.set("enabled", next ? "true" : "false");
                              const res = await setCategoryEnabledAction(fd);
                              applyResult(t("admin.categories_panel.toast_toggle"), res);
                            });
                          }}
                          ariaLabel={t(
                            row.enabled
                              ? "admin.categories_panel.aria_toggle_off"
                              : "admin.categories_panel.aria_toggle_on",
                          )}
                        />
                      </SubtrackTooltip>
                    </td>
                    <td className="admin-table-col-datetime-cell">
                      {formatIntlDateTime(row.updated_at, intlLocale)}
                    </td>
                    <td className="admin-actions-cell">
                      <SubtrackTooltip label={t("admin.categories_panel.aria_edit")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--edit"
                          disabled={busy}
                          aria-label={t("admin.categories_panel.aria_edit")}
                          onClick={() => openEdit(row)}
                        >
                          <IconPencil />
                        </button>
                      </SubtrackTooltip>
                      <SubtrackTooltip label={t("admin.categories_panel.aria_delete")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--delete"
                          disabled={busy}
                          aria-label={t("admin.categories_panel.aria_delete")}
                          onClick={() => {
                            const msg = t("admin.categories_panel.confirm_delete")
                              .replace(/\{label\}/g, resolveCategoryDisplayLabel(row, locale, defaultLocaleCode))
                              .replace(/\{key\}/g, row.category_key);
                            if (typeof window !== "undefined" && !window.confirm(msg)) {
                              return;
                            }
                            startTransition(async () => {
                              const fd = new FormData();
                              fd.set("id", row.id);
                              const res = await deleteCategoryAction(fd);
                              applyResult(t("admin.categories_panel.toast_deleted"), res);
                              if (res.ok) setEditRow(null);
                            });
                          }}
                        >
                          <IconTrash />
                        </button>
                      </SubtrackTooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

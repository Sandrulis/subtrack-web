"use client";

import {
  deleteTranslationKeyAction,
  upsertTranslationValuesAction,
  type TranslationsActionResult,
} from "@/lib/admin/translations-actions";
import type {
  TranslationKeyRow,
  TranslationLanguageColumn,
} from "@/lib/admin/admin-translations-data";
import {
  normalizeTranslationKeyStorage,
  normalizeTranslationKeyWhileTyping,
} from "@/lib/admin/translation-key-normalize";
import { AdminTranslationsIntro } from "@/components/admin/admin-intros";
import { pushDomToast } from "@/lib/push-dom-toast";
import { handleModalBackdropMouseDown } from "@/lib/ui/modal-overlay-guard";
import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";

/** Bez meklēšanas: rindas tiek papildinātas pakāpeniski; meklējot tiek izmantots pilnais katalogs. */
const ROW_WINDOW_INITIAL = 80;
const ROW_WINDOW_STEP = 80;

type AdminTranslationsPanelProps = {
  languages: TranslationLanguageColumn[];
  rows: TranslationKeyRow[];
  loadError: string | null;
};

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

function localesRecordFromMap(
  map: Record<string, string>,
  codes: string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of codes) {
    out[c] = map[c] ?? "";
  }
  return out;
}

function TranslationLocaleFields({
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
              {lang.label}{" "}
              <span className="admin-i18n-code">({code})</span>
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

function AdminI18nModal({
  open,
  title,
  busy,
  onClose,
  onPrimary,
  primaryLabel,
  secondaryLabel,
  children,
}: {
  open: boolean;
  title: string;
  busy: boolean;
  onClose: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  secondaryLabel: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const { t } = useSubtrackIntl();

  useEffect(() => {
    if (!open || busy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  const backdropCloseConfirm = t("ui.modal.confirm_close_backdrop");

  if (!open) return null;

  return (
    <div
      className="modal-overlay open"
      role="presentation"
      onMouseDown={(e) =>
        handleModalBackdropMouseDown(e, onClose, {
          busy,
          confirmMessage: backdropCloseConfirm,
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
          <h2 id={titleId}>{title}</h2>
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
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
            {secondaryLabel}
          </button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onPrimary}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminTranslationsPanel({
  languages,
  rows,
  loadError,
}: AdminTranslationsPanelProps) {
  const { t, locale } = useSubtrackIntl();
  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);

  const [busy, startTransition] = useTransition();

  const languagesAlphabetical = useMemo(() => {
    const collator = new Intl.Collator(intlLocale, { sensitivity: "base" });
    return [...languages].sort(
      (a, b) => collator.compare(a.label, b.label) || collator.compare(a.code, b.code),
    );
  }, [languages, intlLocale]);

  const codes = useMemo(
    () => languagesAlphabetical.map((l) => l.code.trim().toLowerCase()).filter(Boolean),
    [languagesAlphabetical],
  );

  const effectiveLocaleCode = useMemo(() => {
    const hit = languagesAlphabetical.find((l) => l.code.trim().toLowerCase() === locale);
    if (hit) return hit.code.trim().toLowerCase();
    return codes[0] ?? locale;
  }, [languagesAlphabetical, locale, codes]);

  const currentLangLabel = useMemo(() => {
    const hit = languagesAlphabetical.find((l) => l.code.trim().toLowerCase() === effectiveLocaleCode);
    return hit?.label ?? effectiveLocaleCode.toUpperCase();
  }, [languagesAlphabetical, effectiveLocaleCode]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalRow, setEditModalRow] = useState<TranslationKeyRow | null>(null);

  const [newKey, setNewKey] = useState("");
  const [newValues, setNewValues] = useState<Record<string, string>>({});

  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState("");

  const wasSearchingRef = useRef(false);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      if (row.key.toLowerCase().includes(q)) return true;
      for (const c of codes) {
        const v = row.byLocale[c] ?? "";
        if (v.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [rows, searchQuery, codes]);

  const isSearchActive = searchQuery.trim().length > 0;

  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(ROW_WINDOW_INITIAL, rows.length),
  );

  useEffect(() => {
    setVisibleCount((c) => Math.min(c, rows.length));
  }, [rows.length]);

  useEffect(() => {
    const active = searchQuery.trim().length > 0;
    if (wasSearchingRef.current && !active) {
      setVisibleCount(Math.min(ROW_WINDOW_INITIAL, rows.length));
    }
    wasSearchingRef.current = active;
  }, [searchQuery, rows.length]);

  const displayedRows = useMemo(() => {
    if (isSearchActive) return filteredRows;
    return filteredRows.slice(0, Math.min(visibleCount, filteredRows.length));
  }, [isSearchActive, filteredRows, visibleCount]);

  const lazySentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (loadError || rows.length === 0 || languages.length === 0 || isSearchActive) {
      return;
    }
    const el = lazySentinelRef.current;
    if (!el || visibleCount >= filteredRows.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit) return;
        setVisibleCount((c) => Math.min(c + ROW_WINDOW_STEP, filteredRows.length));
      },
      { root: null, rootMargin: "280px 0px", threshold: 0 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [
    loadError,
    rows.length,
    languages.length,
    isSearchActive,
    visibleCount,
    filteredRows.length,
  ]);

  function applyResult(okMsg: string, res: TranslationsActionResult) {
    if (res.ok) {
      pushDomToast(okMsg, "success");
      return true;
    }
    pushDomToast(res.message, "error");
    return false;
  }

  function submitValues(translationKey: string, valuesByLocale: Record<string, string>) {
    const trimmedKey = normalizeTranslationKeyStorage(translationKey);
    if (!trimmedKey) {
      pushDomToast(t("admin.translations_panel.err_key_missing"), "error");
      return;
    }
    const payload: Record<string, string> = {};
    for (const c of codes) {
      payload[c] = valuesByLocale[c] ?? "";
    }
    const nonEmpty = Object.values(payload).some((v) => String(v).trim().length > 0);
    if (!nonEmpty) {
      pushDomToast(t("admin.translations_panel.err_value_missing"), "error");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("translation_key", trimmedKey);
      fd.set("values_json", JSON.stringify(payload));
      const res = await upsertTranslationValuesAction(fd);
      if (applyResult(t("admin.translations_panel.toast_saved"), res)) {
        setNewKey("");
        setNewValues({});
        setCreateModalOpen(false);
        setEditModalRow(null);
      }
    });
  }

  function openCreateModal() {
    setEditModalRow(null);
    setNewKey("");
    setNewValues({});
    setCreateModalOpen(true);
  }

  function openEditModal(row: TranslationKeyRow) {
    setCreateModalOpen(false);
    setEditModalRow(row);
    setEditValues(localesRecordFromMap(row.byLocale, codes));
  }

  const localePlaceholder = t("admin.translations_panel.placeholder_locale_value");

  return (
    <div className="admin-lang-stack admin-i18n-stack">
      <AdminTranslationsIntro
        titleActions={
          !loadError && languages.length > 0 ? (
            <button
              type="button"
              className="btn btn-primary btn-sm admin-lang-add-btn"
              disabled={busy}
              onClick={openCreateModal}
            >
              <IconPlus />
              {t("admin.translations_panel.add_translation_btn")}
            </button>
          ) : undefined
        }
      />

      {loadError ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {t("admin.translations_panel.load_error_intro")} {loadError}
          {t("admin.translations_panel.load_error_mid")}{" "}
          <code className="admin-inline-code">database/supabase/011_site_translations.sql</code>{" "}
          {t("admin.translations_panel.load_error_hint_code")}
        </div>
      ) : null}

      {!loadError && languages.length === 0 ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {t("admin.translations_panel.no_languages_alert")}
        </div>
      ) : null}

      <AdminI18nModal
        open={createModalOpen}
        title={t("admin.translations_panel.new_row_title")}
        busy={busy}
        onClose={() => !busy && setCreateModalOpen(false)}
        onPrimary={() => submitValues(newKey, localesRecordFromMap(newValues, codes))}
        primaryLabel={t("admin.translations_panel.save_key_btn")}
        secondaryLabel={t("admin.translations_panel.aria_cancel_row")}
      >
        <div className="admin-i18n-new admin-i18n-modal-form">
          <div className="form-group admin-i18n-key-field">
            <label htmlFor="modal_new_tr_key">{t("admin.translations_panel.label_key")}</label>
            <input
              id="modal_new_tr_key"
              type="text"
              placeholder={t("admin.translations_panel.placeholder_key_example")}
              autoComplete="off"
              value={newKey}
              disabled={busy || loadError !== null}
              onChange={(e) => setNewKey(normalizeTranslationKeyWhileTyping(e.target.value))}
              onBlur={() => setNewKey((k) => normalizeTranslationKeyStorage(k))}
            />
          </div>
          <TranslationLocaleFields
            languages={languagesAlphabetical}
            valuesByLocale={localesRecordFromMap(newValues, codes)}
            disabled={busy || loadError !== null}
            idsPrefix="modal_new_tr"
            placeholder={localePlaceholder}
            onChange={(code, value) =>
              setNewValues((prev) => ({ ...prev, [code]: value }))
            }
          />
        </div>
      </AdminI18nModal>

      <AdminI18nModal
        open={editModalRow !== null}
        title={t("admin.translations_panel.modal_edit_title")}
        busy={busy}
        onClose={() => !busy && setEditModalRow(null)}
        onPrimary={() => {
          if (!editModalRow) return;
          submitValues(editModalRow.key, localesRecordFromMap(editValues, codes));
        }}
        primaryLabel={t("admin.translations_panel.aria_save_row")}
        secondaryLabel={t("admin.translations_panel.aria_cancel_row")}
      >
        {editModalRow ? (
          <div className="admin-i18n-new admin-i18n-modal-form">
            <p className="admin-i18n-edit-key admin-i18n-edit-key--modal">
              {t("admin.translations_panel.edit_key_prefix")}{" "}
              <code className="admin-inline-code">{editModalRow.key}</code>
            </p>
            <TranslationLocaleFields
              languages={languagesAlphabetical}
              valuesByLocale={localesRecordFromMap(editValues, codes)}
              disabled={busy}
              idsPrefix="modal_edit_tr"
              placeholder={localePlaceholder}
              onChange={(code, value) =>
                setEditValues((prev) => ({ ...prev, [code]: value }))
              }
            />
          </div>
        ) : null}
      </AdminI18nModal>

      {rows.length === 0 && !loadError && languages.length > 0 ? (
        <p className="admin-empty">{t("admin.translations_panel.empty_catalog")}</p>
      ) : !loadError && rows.length > 0 && languages.length > 0 ? (
        <>
          <div className="admin-i18n-search">
            <input
              id="admin_tr_search"
              type="search"
              className="admin-i18n-search-input"
              autoComplete="off"
              aria-label={t("admin.translations_panel.search_placeholder")}
              placeholder={t("admin.translations_panel.search_placeholder")}
              value={searchQuery}
              disabled={busy}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isSearchActive ? (
            <p className="admin-i18n-search-scope-hint">{t("admin.translations_panel.lazy_search_scope_hint")}</p>
          ) : null}
          {filteredRows.length === 0 ? (
            <p className="admin-empty">{t("admin.translations_panel.search_no_results")}</p>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--translations admin-table--translations-compact">
                <thead>
                  <tr>
                    <th scope="col" className="admin-i18n-th-key">
                      {t("admin.translations_panel.th_key")}
                    </th>
                    <th scope="col" className="admin-i18n-th-locale">
                      <span className="admin-i18n-th-main">{currentLangLabel}</span>
                      <span className="admin-i18n-th-sub">{effectiveLocaleCode}</span>
                    </th>
                    <th
                      scope="col"
                      className="admin-table-col-actions-head"
                      aria-label={t("admin.translations_panel.aria_actions")}
                    />
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row) => {
                    const text = row.byLocale[effectiveLocaleCode] ?? "";
                    const display =
                      text.trim().length > 0 ? (
                        <span className="admin-i18n-cell-full">{text}</span>
                      ) : (
                        "\u2014"
                      );
                    return (
                      <tr key={row.key}>
                        <td>
                          <code className="admin-inline-code">{row.key}</code>
                        </td>
                        <td className="admin-i18n-cell-val">
                          <SubtrackTooltip
                            label={text.trim()}
                            wrapperClassName="subtrack-tooltip-wrap--fill"
                          >
                            {display}
                          </SubtrackTooltip>
                        </td>
                        <td className="admin-actions-cell">
                          <SubtrackTooltip label={t("admin.translations_panel.aria_edit")}>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--edit"
                              disabled={busy}
                              aria-label={t("admin.translations_panel.aria_edit")}
                              onClick={() => openEditModal(row)}
                            >
                              <IconPencil />
                            </button>
                          </SubtrackTooltip>
                          <SubtrackTooltip label={t("admin.translations_panel.aria_delete")}>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--delete"
                              disabled={busy}
                              aria-label={t("admin.translations_panel.aria_delete")}
                              onClick={() => {
                                const msg = t(
                                  "admin.translations_panel.confirm_delete_key",
                                ).replace(/\{key\}/g, row.key);
                                if (typeof window !== "undefined" && !window.confirm(msg)) {
                                  return;
                                }
                                startTransition(async () => {
                                  const fd = new FormData();
                                  fd.set("translation_key", row.key);
                                  const res = await deleteTranslationKeyAction(fd);
                                  applyResult(t("admin.translations_panel.toast_key_deleted"), res);
                                  if (res.ok) setEditModalRow(null);
                                });
                              }}
                            >
                              <IconTrash />
                            </button>
                          </SubtrackTooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              {!isSearchActive && displayedRows.length < filteredRows.length ? (
                <div ref={lazySentinelRef} className="admin-i18n-lazy-sentinel" aria-hidden />
              ) : null}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

"use client";

import {
  deleteIntegrationAction,
  createIntegrationAction,
  setIntegrationEnabledAction,
  updateIntegrationLabelAction,
  type IntegrationsActionResult,
} from "@/lib/admin/integrations-actions";
import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { useMemo, useState, useTransition } from "react";

export type AdminIntegrationRow = {
  id: string;
  integration_key: string;
  label: string;
  enabled: boolean;
  updated_at: string;
};

type AdminIntegrationsPanelProps = {
  rows: AdminIntegrationRow[];
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

function IconCheck() {
  return (
    <svg className="admin-btn-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg className="admin-btn-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />
    </svg>
  );
}

function IntegrationSwitch({
  checked,
  disabled,
  onCheckedChange,
  ariaLabelledBy,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
  /** Ja norādīts, `aria-label` nav vajadzīgs (piem., forma ar redzamu virsrakstu). */
  ariaLabelledBy?: string;
  /** Ja nav `ariaLabelledBy`, izmanto kā vienīgo pieejamības nosaukumu. */
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

export function AdminIntegrationsPanel({
  rows,
  loadError,
}: AdminIntegrationsPanelProps) {
  const { t, locale } = useSubtrackIntl();
  const intlLocale = useMemo(() => uiLocaleCodeToBcp47ForIntl(locale), [locale]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newEnabled, setNewEnabled] = useState(false);

  function applyResult(okMsg: string, res: IntegrationsActionResult) {
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
          {t("admin.integrations_panel.load_error_intro")} {loadError}.
          {t("admin.integrations_panel.load_error_migration")}{" "}
          <code className="admin-inline-code">database/supabase/024_integrations.sql</code>{" "}
          {t("admin.integrations_panel.load_error_hint_code")}{" "}
          <code className="admin-inline-code">public.integrations</code>
          {t("admin.integrations_panel.load_error_suffix")}
        </div>
      ) : null}

      <div className="admin-lang-card">
        <p className="admin-lang-card-title">{t("admin.integrations_panel.new_title")}</p>
        <div className="admin-lang-new-form">
          <div className="admin-lang-new-row admin-lang-new-row--integrations">
            <div className="form-group admin-lang-field-code">
              <label htmlFor="new_integration_key">{t("admin.integrations_panel.label_key")}</label>
              <input
                id="new_integration_key"
                type="text"
                placeholder={t("admin.integrations_panel.placeholder_key")}
                autoComplete="off"
                value={newKey}
                disabled={busy}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="form-group admin-lang-field-label">
              <label htmlFor="new_integration_label">{t("admin.integrations_panel.label_name")}</label>
              <input
                id="new_integration_label"
                type="text"
                placeholder={t("admin.integrations_panel.placeholder_name")}
                autoComplete="off"
                value={newLabel}
                disabled={busy}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="form-group admin-integration-switch-field">
              <span className="admin-integration-switch-caption" id="new_integration_enabled_caption">
                {t("admin.integrations_panel.label_enabled")}
              </span>
              <IntegrationSwitch
                checked={newEnabled}
                disabled={busy || loadError !== null}
                onCheckedChange={setNewEnabled}
                ariaLabelledBy="new_integration_enabled_caption"
              />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm admin-lang-add-btn"
              disabled={busy || loadError !== null}
              onClick={() => {
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("integration_key", newKey);
                  fd.set("label", newLabel);
                  fd.set("enabled", newEnabled ? "true" : "false");
                  const res = await createIntegrationAction(fd);
                  if (applyResult(t("admin.integrations_panel.toast_added"), res)) {
                    setNewKey("");
                    setNewLabel("");
                    setNewEnabled(false);
                  }
                });
              }}
            >
              <IconPlus />
              {t("admin.integrations_panel.add_btn")}
            </button>
          </div>
          <p className="admin-lang-new-hints" aria-live="polite">
            {t("admin.integrations_panel.hints_line")}
          </p>
        </div>
      </div>

      {rows.length === 0 && !loadError ? (
        <p className="admin-empty">{t("admin.integrations_panel.empty")}</p>
      ) : !loadError && rows.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--languages">
            <colgroup>
              <col className="admin-table-col-code" />
              <col className="admin-table-col-label" />
              <col />
              <col className="admin-table-col-datetime" />
              <col className="admin-table-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">{t("admin.integrations_panel.th_key")}</th>
                <th scope="col">{t("admin.integrations_panel.th_name")}</th>
                <th scope="col">{t("admin.integrations_panel.th_enabled")}</th>
                <th scope="col" className="admin-table-col-datetime-head">
                  {t("admin.integrations_panel.th_updated")}
                </th>
                <th
                  scope="col"
                  className="admin-table-col-actions-head"
                  aria-label={t("admin.integrations_panel.aria_actions")}
                />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
                editingId === row.id ? (
                  <EditIntegrationRow
                    key={row.id}
                    row={row}
                    busy={busy}
                    onCancel={() => setEditingId(null)}
                    onSave={(payload) => {
                      startTransition(async () => {
                        const fd = new FormData();
                        fd.set("id", row.id);
                        fd.set("label", payload.label);
                        const res = await updateIntegrationLabelAction(fd);
                        if (applyResult(t("admin.integrations_panel.toast_saved"), res)) {
                          setEditingId(null);
                        }
                      });
                    }}
                  />
                ) : (
                  <tr key={row.id}>
                    <td>
                      <code className="admin-inline-code">{row.integration_key}</code>
                    </td>
                    <td>{row.label}</td>
                    <td className="admin-integration-enabled-cell">
                      <SubtrackTooltip
                        label={
                          row.enabled
                            ? t("admin.integrations_panel.state_on")
                            : t("admin.integrations_panel.state_off")
                        }
                      >
                        <IntegrationSwitch
                          checked={row.enabled}
                          disabled={busy}
                          onCheckedChange={(next) => {
                            startTransition(async () => {
                              const fd = new FormData();
                              fd.set("id", row.id);
                              fd.set("enabled", next ? "true" : "false");
                              const res = await setIntegrationEnabledAction(fd);
                              applyResult(t("admin.integrations_panel.toast_toggle"), res);
                            });
                          }}
                          ariaLabel={t(
                            row.enabled
                              ? "admin.integrations_panel.aria_toggle_off"
                              : "admin.integrations_panel.aria_toggle_on",
                          )}
                        />
                      </SubtrackTooltip>
                    </td>
                    <td className="admin-table-col-datetime-cell">
                      {formatIntlDateTime(row.updated_at, intlLocale)}
                    </td>
                    <td className="admin-actions-cell">
                      <SubtrackTooltip label={t("admin.integrations_panel.aria_edit")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--edit"
                          disabled={busy}
                          aria-label={t("admin.integrations_panel.aria_edit")}
                          onClick={() => setEditingId(row.id)}
                        >
                          <IconPencil />
                        </button>
                      </SubtrackTooltip>
                      <SubtrackTooltip label={t("admin.integrations_panel.aria_delete")}>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--delete"
                          disabled={busy}
                          aria-label={t("admin.integrations_panel.aria_delete")}
                          onClick={() => {
                            const msg = t("admin.integrations_panel.confirm_delete")
                              .replace(/\{label\}/g, row.label)
                              .replace(/\{key\}/g, row.integration_key);
                            if (typeof window !== "undefined" && !window.confirm(msg)) {
                              return;
                            }
                            startTransition(async () => {
                              const fd = new FormData();
                              fd.set("id", row.id);
                              const res = await deleteIntegrationAction(fd);
                              applyResult(t("admin.integrations_panel.toast_deleted"), res);
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

function EditIntegrationRow({
  row,
  busy,
  onCancel,
  onSave,
}: {
  row: AdminIntegrationRow;
  busy: boolean;
  onCancel: () => void;
  onSave: (payload: { label: string }) => void;
}) {
  const { t } = useSubtrackIntl();
  const [label, setLabel] = useState(row.label);

  return (
    <tr>
      <td colSpan={5}>
        <div className="admin-lang-edit admin-lang-edit--inline">
          <div className="admin-lang-edit-row">
            <div className="form-group admin-lang-field-code admin-integration-edit-key-ro">
              <span className="admin-integration-edit-ro-label">{t("admin.integrations_panel.label_key")}</span>
              <code className="admin-inline-code">{row.integration_key}</code>
            </div>
            <div className="form-group admin-lang-field-label-wide">
              <label htmlFor={`intl-label-${row.id}`}>{t("admin.integrations_panel.th_name")}</label>
              <input
                id={`intl-label-${row.id}`}
                type="text"
                value={label}
                disabled={busy}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="admin-lang-edit-actions">
              <SubtrackTooltip label={t("admin.integrations_panel.aria_save_edit")}>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--save"
                  disabled={busy}
                  aria-label={t("admin.integrations_panel.aria_save_edit")}
                  onClick={() => onSave({ label })}
                >
                  <IconCheck />
                </button>
              </SubtrackTooltip>
              <SubtrackTooltip label={t("admin.integrations_panel.aria_cancel_edit")}>
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn--neutral"
                  disabled={busy}
                  aria-label={t("admin.integrations_panel.aria_cancel_edit")}
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

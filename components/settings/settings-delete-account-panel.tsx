"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { pushDomToast } from "@/lib/push-dom-toast";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type DeleteModalStep = "confirm" | "reason" | "password";

export function SettingsDeleteAccountPanel({
  userDisplay,
  accountEmail = "",
  ready = true,
}: {
  userDisplay?: NavUserDisplay | null;
  accountEmail?: string;
  /** Preferences forma ir hidratēta (poga neaktīva, kamēr nav gatavs). */
  ready?: boolean;
}) {
  const { t } = useSubtrackIntl();
  const router = useRouter();
  const deleteModalTitleId = useId();
  const deleteConfirmBtnRef = useRef<HTMLButtonElement>(null);

  const [deleteModalStep, setDeleteModalStep] = useState<DeleteModalStep | null>(
    null,
  );
  const [deleteReason, setDeleteReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const showDeleteAccount = Boolean(userDisplay) && !userDisplay?.isAdmin;
  const showAdminHint = Boolean(userDisplay?.isAdmin);

  const deleteConfirmBody = useMemo(() => {
    const email = accountEmail.trim() || "–";
    return t("settings.delete_account.confirm").replace(/\{email\}/g, email);
  }, [accountEmail, t]);

  function closeDeleteModal() {
    setDeleteModalStep(null);
    setDeleteReason("");
    setDeletePassword("");
    setShowDeletePassword(false);
  }

  useEffect(() => {
    if (!deleteModalStep) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleteBusy) {
        closeDeleteModal();
      }
    };
    window.addEventListener("keydown", onKey);
    const tmr = window.setTimeout(() => deleteConfirmBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(tmr);
    };
  }, [deleteModalStep, deleteBusy]);

  async function confirmDeleteAccount() {
    if (deleteBusy) return;
    const password = deletePassword;
    if (!password) {
      pushDomToast(t("settings.delete_account.password_required"), "error");
      return;
    }
    setDeleteBusy(true);
    try {
      const reason = deleteReason.trim().slice(0, 4000);
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, password }),
      });
      let data: { success?: boolean; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok || data.success !== true) {
        pushDomToast(data.message ?? t("settings.delete_account.error"), "error");
        return;
      }
      closeDeleteModal();
      pushDomToast(t("settings.delete_account.success"), "success");
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } catch {
      pushDomToast(t("settings.delete_account.error"), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (!showDeleteAccount && !showAdminHint) {
    return null;
  }

  const passwordEmpty = deletePassword.trim().length === 0;

  return (
    <>
      <section
        className="settings-hub-panel auth-card settings-hub-panel--delete"
        aria-labelledby="settings-hub-delete-heading"
      >
        <div className="settings-hub-panel-icon settings-hub-panel-icon--danger" aria-hidden="true">
          <i className="fa-solid fa-user-xmark" />
        </div>
        <h2 id="settings-hub-delete-heading" className="settings-hub-panel-title">
          {t("settings.section_account")}
        </h2>
        <p className="settings-hub-panel-lead">
          {showDeleteAccount
            ? t("settings.delete_account.lead")
            : t("settings.delete_account.admin_hint")}
        </p>
        {showDeleteAccount ? (
          <button
            type="button"
            className="btn btn-danger settings-delete-account-btn"
            disabled={!ready || deleteBusy}
            onClick={() => setDeleteModalStep("confirm")}
          >
            {t("settings.delete_account.btn")}
          </button>
        ) : null}
      </section>

      {deleteModalStep ? (
        <div
          className="modal-overlay modal-backdrop-close-confirm-overlay open"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleteBusy) {
              closeDeleteModal();
            }
          }}
        >
          <div
            className="modal modal-backdrop-close-confirm admin-todos-delete-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={deleteModalTitleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-body">
              <div
                className="modal-backdrop-close-confirm-icon admin-todos-delete-confirm-icon"
                aria-hidden="true"
              >
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              {deleteModalStep === "confirm" ? (
                <>
                  <h3 id={deleteModalTitleId}>{t("settings.delete_account.btn")}</h3>
                  <p>{deleteConfirmBody}</p>
                </>
              ) : deleteModalStep === "reason" ? (
                <>
                  <h3 id={deleteModalTitleId}>
                    {t("settings.delete_account.reason_title")}
                  </h3>
                  <p className="form-hint form-hint--settings-under-select">
                    {t("settings.delete_account.reason_lead")}
                  </p>
                  <div className="form-group">
                    <label htmlFor="delete-account-reason">
                      {t("settings.delete_account.reason_label")}
                    </label>
                    <textarea
                      id="delete-account-reason"
                      rows={4}
                      maxLength={4000}
                      value={deleteReason}
                      disabled={deleteBusy}
                      placeholder={t("settings.delete_account.reason_placeholder")}
                      onChange={(e) => setDeleteReason(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3 id={deleteModalTitleId}>
                    {t("settings.delete_account.password_title")}
                  </h3>
                  <p className="form-hint form-hint--settings-under-select">
                    {t("settings.delete_account.password_required")}
                  </p>
                  <div className="form-group">
                    <label htmlFor="delete-account-password">
                      {t("settings.delete_account.password_label")}
                    </label>
                    <div className="form-password-wrap">
                      <input
                        type={showDeletePassword ? "text" : "password"}
                        id="delete-account-password"
                        name="delete_account_password"
                        autoComplete="current-password"
                        placeholder="●●●●●●●●"
                        value={deletePassword}
                        disabled={deleteBusy}
                        className="input-has-password-toggle"
                        onChange={(e) => setDeletePassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        disabled={deleteBusy}
                        onClick={() => setShowDeletePassword((v) => !v)}
                        aria-label={
                          showDeletePassword
                            ? t("auth.change_password.toggle_hide")
                            : t("auth.change_password.toggle_show")
                        }
                        aria-pressed={showDeletePassword}
                      >
                        <i
                          className={
                            showDeletePassword
                              ? "fa-solid fa-eye-slash"
                              : "fa-regular fa-eye"
                          }
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={deleteBusy}
                onClick={() => {
                  if (deleteModalStep === "password") {
                    setDeleteModalStep("reason");
                    return;
                  }
                  if (deleteModalStep === "reason") {
                    setDeleteModalStep("confirm");
                    return;
                  }
                  closeDeleteModal();
                }}
              >
                {deleteModalStep === "confirm"
                  ? t("admin.todos.cancel")
                  : t("settings.delete_account.reason_back")}
              </button>
              <button
                ref={deleteConfirmBtnRef}
                type="button"
                className="btn btn-danger"
                disabled={
                  deleteBusy ||
                  (deleteModalStep === "password" && passwordEmpty)
                }
                aria-busy={deleteBusy}
                onClick={() => {
                  if (deleteModalStep === "confirm") {
                    setDeleteModalStep("reason");
                    return;
                  }
                  if (deleteModalStep === "reason") {
                    setDeleteModalStep("password");
                    return;
                  }
                  void confirmDeleteAccount();
                }}
              >
                {deleteModalStep === "password"
                  ? t("settings.delete_account.btn")
                  : t("settings.delete_account.reason_continue")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

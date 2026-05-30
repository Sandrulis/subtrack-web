"use client";

import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { pushDomToast } from "@/lib/push-dom-toast";
import { formatUserLastSeenDisplay, formatDateTimeIntl } from "@/lib/admin/format-user-last-seen-display";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { navUserHasProEntitlement } from "@/lib/auth/pro-plan-access";
import { isProTrialActive, type ProTrialConfig } from "@/lib/auth/pro-trial-access";
import { getAdminUserPlanLabelKey } from "@/lib/admin/admin-user-plan-label";
import {
  ADMIN_USERS_FILTER_CARD_KEYS,
  type AdminUsersFilter,
  countAdminUsersByFilter,
  matchesAdminUsersFilter,
} from "@/lib/admin/admin-users-filter";
import type { AdminUsersViewUserRow } from "@/lib/admin/admin-users-data";
import { UserAvatar } from "@/components/user-avatar";
import { isHttpsAvatarUrl } from "@/lib/auth/oauth-avatar-url";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type AdminUsersViewUser = AdminUsersViewUserRow;

type SubscriptionCategory =
  | "subscription"
  | "bill"
  | "credit"
  | "leasing"
  | "insurance"
  | "other";

const SUBSCRIPTION_CATEGORY_ORDER: SubscriptionCategory[] = [
  "subscription",
  "bill",
  "credit",
  "leasing",
  "insurance",
  "other",
];

export type AdminUsersCountsSerializable = Partial<
  Record<SubscriptionCategory, number>
>;

type AdminUsersViewProps = {
  users: AdminUsersViewUser[];
  countsByUserId: Record<string, AdminUsersCountsSerializable> | null;
  /** Ja true, rāda VIP slēdzi (`system_settings.paid_plan_enabled`); Pro – kronītis pie avatāra. */
  paidPlanEnabled?: boolean;
  proTrial?: ProTrialConfig;
  /** Pašreizējā admin sesijas lietotāja ID (nevar dzēst sevi). */
  currentUserId?: string | null;
  fetchError?: string | null;
  subscriptionsFetchError?: string | null;
};

export function AdminUsersView({
  users,
  countsByUserId,
  paidPlanEnabled = false,
  proTrial = { enabled: false, days: 14 },
  currentUserId = null,
  fetchError,
  subscriptionsFetchError,
}: AdminUsersViewProps) {
  const { t, locale } = useSubtrackIntl();
  const router = useRouter();
  const intlLocale = useMemo(
    () => uiLocaleCodeToBcp47ForIntl(locale),
    [locale],
  );
  const [userFilter, setUserFilter] = useState<AdminUsersFilter>("all");
  const [deletePendingUser, setDeletePendingUser] =
    useState<AdminUsersViewUser | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const filterCtx = useMemo(
    () => ({ paidPlanEnabled, proTrial }),
    [paidPlanEnabled, proTrial],
  );

  const toFilterRow = (u: AdminUsersViewUser) => ({
    paidPlanActive: u.paidPlanActive,
    proVip: u.proVip,
    paidPlanType: u.paidPlanType,
    proTrialUsed: u.proTrialUsed,
    proTrialStartedAt: u.proTrialStartedAt,
  });

  const filterCounts = useMemo(
    () => countAdminUsersByFilter(users.map(toFilterRow), filterCtx),
    [users, filterCtx],
  );

  const visibleFilterCards = useMemo(
    () =>
      ADMIN_USERS_FILTER_CARD_KEYS.filter((key) => (filterCounts[key] ?? 0) > 0),
    [filterCounts],
  );

  useEffect(() => {
    if (userFilter !== "all" && (filterCounts[userFilter] ?? 0) === 0) {
      setUserFilter("all");
    }
  }, [userFilter, filterCounts]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      matchesAdminUsersFilter(toFilterRow(u), userFilter, filterCtx),
    );
  }, [users, userFilter, filterCtx]);

  function onFilterCardClick(key: AdminUsersFilter) {
    setUserFilter((prev) => (prev === key ? "all" : key));
  }

  const deleteConfirmBody = useMemo(() => {
    if (!deletePendingUser) return "";
    const email = deletePendingUser.email?.trim() || "–";
    return t("admin.users.delete_confirm")
      .replace(/\{email\}/g, email)
      .replace(/\{name\}/g, fullDisplayName(deletePendingUser));
  }, [deletePendingUser, t]);

  async function confirmDeleteUser() {
    if (!deletePendingUser || deleteBusy) return;
    setDeleteBusy(true);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deletePendingUser.id }),
      });
      let data: { success?: boolean; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok || data.success !== true) {
        pushDomToast(data.message ?? t("admin.users.err_delete"), "error");
        return;
      }
      setDeletePendingUser(null);
      pushDomToast(t("admin.users.delete_success"), "success");
      router.refresh();
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="admin-page admin-users-page admin-lang-stack">
      <div className="admin-page-head">
        <h1 className="admin-page-title">{t("admin.users.heading")}</h1>
        <p className="admin-page-lead">{t("admin.users.lead_intro")}</p>
      </div>

      {fetchError ? (
        <div className="admin-alert admin-alert--error" role="alert">
          {t("admin.users.err_users_prefix")}
          {": "}
          {fetchError}.
          {" "}
          {t("admin.users.err_users_rls_hint")}
          {" "}
          <code className="admin-inline-code">
            database/supabase/003_admin_users_select_policy.sql
          </code>{" "}
          ({t("admin.users.err_fn_policy_hint")}:{" "}
          <code className="admin-inline-code">current_user_is_admin</code>,{" "}
          <code className="admin-inline-code">users_select_all_if_admin</code>
          ).
        </div>
      ) : users.length === 0 ? (
        <p className="admin-empty">{t("admin.users.empty")}</p>
      ) : (
        <>
          {subscriptionsFetchError ? (
            <div className="admin-alert admin-alert--warning" role="status">
              {t("admin.users.err_subs_prefix")}
              {": "}
              {subscriptionsFetchError}.{" "}
              {t("admin.users.err_subs_policy")}
              {" "}
              <code className="admin-inline-code">
                database/supabase/008_admin_subscriptions_select_policy.sql
              </code>
              .
            </div>
          ) : null}

          {paidPlanEnabled && visibleFilterCards.length > 0 ? (
            <div
              className="admin-users-summary stats-row"
              role="toolbar"
              aria-label={t("admin.users.filter_toolbar")}
            >
              {visibleFilterCards.map((key) => {
                const count = filterCounts[key] ?? 0;
                const active = userFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={
                      "stat-card admin-users-summary-card" +
                      (active ? " admin-users-summary-card--active" : "")
                    }
                    aria-pressed={active}
                    onClick={() => onFilterCardClick(key)}
                  >
                    <span className="stat-label">{t(`admin.users.filter_${key}`)}</span>
                    <span className="stat-value">{count}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("admin.users.col_user")}</th>
                  <th className="admin-table-col-counts">
                    {t("admin.users.col_records")}
                  </th>
                  {paidPlanEnabled ? (
                    <th className="admin-table-col-pro">
                      {t("admin.users.col_pro")}
                    </th>
                  ) : null}
                  {paidPlanEnabled ? (
                    <th className="admin-table-col-vip">
                      {t("admin.users.col_vip")}
                    </th>
                  ) : null}
                  <th className="admin-table-col-registered">
                    {t("admin.users.col_registered")}
                  </th>
                  <th className="admin-table-col-actions">
                    {t("admin.users.col_actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={paidPlanEnabled ? 5 : 3} className="admin-empty">
                      {t("admin.users.filter_empty")}
                    </td>
                  </tr>
                ) : null}
                {filteredUsers.map((u) => {
                  const trialActive = isProTrialActive(
                    {
                      paidPlanActive: u.paidPlanActive,
                      proVip: u.proVip,
                      proTrialUsed: u.proTrialUsed,
                      proTrialStartedAt: u.proTrialStartedAt,
                    },
                    proTrial,
                    { paidPlanEnabled },
                  );
                  const hasPro = navUserHasProEntitlement({
                    paidPlanActive: u.paidPlanActive,
                    proVip: u.proVip,
                    proTrialActive: trialActive,
                  });
                  const planLabelKey = getAdminUserPlanLabelKey(u);
                  return (
                    <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar-wrap">
                          {hasPro ? (
                            <span
                              className="admin-user-paid-crown"
                              aria-hidden="true"
                            >
                              <i className="fa-solid fa-crown" />
                            </span>
                          ) : null}
                          <SubtrackTooltip label={fullDisplayName(u)}>
                            <UserAvatar
                              initials={userAvatarInitials(
                                u.name,
                                u.surname,
                                u.email,
                              )}
                              avatarUrl={
                                isHttpsAvatarUrl(u.avatarUrl) ? u.avatarUrl : null
                              }
                              className="admin-user-avatar"
                            />
                          </SubtrackTooltip>
                        </div>
                        <div className="admin-user-meta">
                          <div className="admin-user-name">
                            {fullDisplayName(u)}
                          </div>
                          <div className="admin-user-email">
                            {u.email?.trim() || "–"}
                          </div>
                          {u.is_admin > 0 ? (
                            <div className="admin-user-role-under-email">
                              <span className="admin-badge admin-badge--admin">
                                {t("admin.users.role_admin")}
                              </span>
                            </div>
                          ) : null}
                          {hasPro ? (
                            <span
                              className="admin-user-pro-crown-mobile-only"
                              aria-hidden="true"
                            >
                              <i className="fa-solid fa-crown" />
                            </span>
                          ) : null}
                          <div className="admin-user-registered-mobile">
                            <span className="admin-user-meta-mobile-label">
                              {t("admin.users.col_registered")}
                            </span>
                            <span className="admin-user-meta-mobile-value">
                              <AdminUserRegisteredDates
                                createdAt={u.created_at}
                                lastSeen={u.last_seen}
                                intlLocale={intlLocale}
                                t={t}
                              />
                            </span>
                          </div>
                          {paidPlanEnabled ? (
                            <div className="admin-user-vip-mobile">
                              <span className="admin-user-meta-mobile-label">
                                {t("admin.users.col_vip")}
                              </span>
                              <span className="admin-user-meta-mobile-value">
                                <AdminUserVipSwitch
                                  userId={u.id}
                                  checked={u.proVip === true}
                                />
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-col-counts">
                      <SubscriptionCountsCell
                        raw={countsByUserId?.[u.id]}
                        subsLoaded={!subscriptionsFetchError}
                      />
                    </td>
                    {paidPlanEnabled ? (
                      <td className="admin-table-col-pro">
                        {trialActive && !u.proVip && !u.paidPlanActive ? (
                          <span className="admin-badge admin-badge--trial">
                            {t("admin.users.plan_trial")}
                          </span>
                        ) : planLabelKey ? (
                          <span
                            className={
                              "admin-badge" +
                              (u.proVip
                                ? " admin-badge--vip"
                                : u.paidPlanActive
                                  ? " admin-badge--pro"
                                  : "")
                            }
                          >
                            {t(planLabelKey)}
                          </span>
                        ) : (
                          <span className="admin-text-muted">–</span>
                        )}
                      </td>
                    ) : null}
                    {paidPlanEnabled ? (
                      <td className="admin-table-col-vip">
                        <AdminUserVipSwitch
                          userId={u.id}
                          checked={u.proVip === true}
                        />
                      </td>
                    ) : null}
                    <td className="admin-table-col-registered">
                      <AdminUserRegisteredDates
                        createdAt={u.created_at}
                        lastSeen={u.last_seen}
                        intlLocale={intlLocale}
                        t={t}
                      />
                    </td>
                    <td className="admin-table-col-actions admin-actions-cell">
                      {paidPlanEnabled && u.stripeCustomerId && !u.proVip ? (
                        <AdminUserStripeSyncButton userId={u.id} />
                      ) : null}
                      <AdminUserDeleteControl
                        user={u}
                        currentUserId={currentUserId}
                        deleteBusy={deleteBusy}
                        onRequestDelete={() => setDeletePendingUser(u)}
                      />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <AdminUserDeleteConfirmModal
        open={deletePendingUser !== null}
        busy={deleteBusy}
        confirmBody={deleteConfirmBody}
        t={t}
        onCancel={() => {
          if (!deleteBusy) setDeletePendingUser(null);
        }}
        onConfirm={() => {
          void confirmDeleteUser();
        }}
      />
    </div>
  );
}

function AdminUserDeleteConfirmModal({
  open,
  busy,
  confirmBody,
  t,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  confirmBody: string;
  t: (k: string) => string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    const tmr = window.setTimeout(() => confirmBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(tmr);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay modal-backdrop-close-confirm-overlay open"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="modal modal-backdrop-close-confirm admin-todos-delete-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-body">
          <div
            className="modal-backdrop-close-confirm-icon admin-todos-delete-confirm-icon"
            aria-hidden="true"
          >
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <h3 id={titleId}>{t("admin.users.delete_link")}</h3>
          <p>{confirmBody}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onCancel}>
            {t("admin.todos.cancel")}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="btn btn-danger"
            disabled={busy}
            aria-busy={busy}
            onClick={onConfirm}
          >
            {t("admin.users.delete_link")}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminUserStripeSyncButton({ userId }: { userId: string }) {
  const { t } = useSubtrackIntl();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function sync() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/sync-stripe-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      let data: {
        success?: boolean;
        message?: string;
        source?: string;
        paid_plan_active?: boolean;
      } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok || data.success !== true) {
        pushDomToast(data.message ?? t("admin.users.err_stripe_sync"), "error");
        return;
      }
      if (data.source === "cleared") {
        pushDomToast(t("admin.users.stripe_sync_cleared"), "success");
      } else {
        pushDomToast(t("admin.users.stripe_sync_ok"), "success");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SubtrackTooltip label={t("admin.users.stripe_sync_tooltip")}>
      <button
        type="button"
        className="admin-icon-btn admin-icon-btn--edit"
        disabled={busy}
        aria-label={t("admin.users.stripe_sync_aria")}
        aria-busy={busy}
        onClick={() => {
          void sync();
        }}
      >
        <IconRefresh />
      </button>
    </SubtrackTooltip>
  );
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 13.4-5.9M20 7v5h-5M20 12a8 8 0 0 1-13.4 5.9M4 17v-5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function AdminUserDeleteControl({
  user,
  currentUserId,
  deleteBusy,
  onRequestDelete,
}: {
  user: AdminUsersViewUser;
  currentUserId: string | null;
  deleteBusy: boolean;
  onRequestDelete: () => void;
}) {
  const { t } = useSubtrackIntl();

  const isSelf = currentUserId != null && user.id === currentUserId;
  const isAdminUser = user.is_admin > 0;
  const disabled = deleteBusy || isSelf || isAdminUser;

  if (isSelf || isAdminUser) {
    return <span className="admin-actions-empty">–</span>;
  }

  return (
    <SubtrackTooltip label={t("admin.users.delete_link")}>
      <button
        type="button"
        className="admin-icon-btn admin-icon-btn--delete"
        disabled={disabled}
        aria-label={t("admin.users.delete_link")}
        aria-busy={deleteBusy}
        onClick={onRequestDelete}
      >
        <IconTrash />
      </button>
    </SubtrackTooltip>
  );
}

function AdminUserVipSwitch({
  userId,
  checked,
}: {
  userId: string;
  checked: boolean;
}) {
  const { t } = useSubtrackIntl();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !checked;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/pro-vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, proVip: next }),
      });
      let data: { success?: boolean; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok || data.success !== true) {
        pushDomToast(data.message ?? t("admin.users.err_vip_update"), "error");
        return;
      }
      pushDomToast(t("admin.users.vip_saved"), "success");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      className={`admin-switch${checked ? " is-on" : ""}`}
      aria-checked={checked}
      aria-label={t("admin.users.vip_toggle_aria")}
      aria-busy={busy}
      disabled={busy}
      onClick={() => {
        void toggle();
      }}
    >
      <span className="admin-switch-track" aria-hidden />
      <span className="admin-switch-thumb" aria-hidden />
    </button>
  );
}

function SubscriptionCountsCell(props: {
  raw: AdminUsersCountsSerializable | undefined;
  subsLoaded: boolean;
}) {
  const { raw, subsLoaded } = props;

  const total = useMemo(() => {
    if (!raw) return 0;
    let sum = 0;
    for (const cat of SUBSCRIPTION_CATEGORY_ORDER) {
      const v = raw[cat];
      if (typeof v === "number" && v > 0) sum += v;
    }
    return sum;
  }, [raw]);

  if (!subsLoaded) {
    return <span className="admin-sub-counts admin-sub-counts--empty">–</span>;
  }

  return (
    <div className="admin-sub-counts">
      <span className="admin-sub-counts-total">{total}</span>
    </div>
  );
}

function stableLastSeenLabel(
  lastSeen: string | null,
  intlLocale: string,
): string {
  if (!lastSeen?.trim()) return "–";
  const d = new Date(lastSeen);
  if (Number.isNaN(d.getTime())) return "–";
  return formatDateTimeIntl(lastSeen, intlLocale);
}

function AdminUserRegisteredDates({
  createdAt,
  lastSeen,
  intlLocale,
  t,
}: {
  createdAt: string;
  lastSeen: string | null;
  intlLocale: string;
  t: (key: string) => string;
}) {
  const [lastSeenText, setLastSeenText] = useState(() =>
    stableLastSeenLabel(lastSeen, intlLocale),
  );

  useEffect(() => {
    setLastSeenText(formatUserLastSeenDisplay(lastSeen, t, intlLocale));
  }, [lastSeen, intlLocale, t]);

  return (
    <div className="admin-user-dates-col">
      <time dateTime={createdAt || undefined}>
        {formatDateTimeIntl(createdAt, intlLocale)}
      </time>
      <time
        className="admin-user-last-seen"
        dateTime={lastSeen ?? undefined}
        title={
          lastSeen
            ? `${t("admin.users.last_seen")}: ${formatDateTimeIntl(lastSeen, intlLocale)}`
            : undefined
        }
      >
        {lastSeenText}
      </time>
    </div>
  );
}

function fullDisplayName(u: Pick<AdminUsersViewUser, "name" | "surname">): string {
  const n = u.name?.trim() ?? "";
  const s = u.surname?.trim() ?? "";
  const combined = [n, s].filter(Boolean).join(" ");
  return combined || "–";
}

function userAvatarInitials(
  name: string | null | undefined,
  surname: string | null | undefined,
  email: string | null | undefined,
): string {
  const n = name?.trim() ?? "";
  const s = surname?.trim() ?? "";
  const first = n.charAt(0);
  const second = s.charAt(0);
  if (first && second) return `${first}${second}`.toUpperCase();
  if (first) return first.toUpperCase();
  if (second) return second.toUpperCase();
  const mail = email?.trim() ?? "";
  if (mail.length >= 2) return mail.slice(0, 2).toUpperCase();
  if (mail.length === 1) return mail.toUpperCase();
  return "?";
}

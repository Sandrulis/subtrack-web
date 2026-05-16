"use client";

import { SubtrackTooltip } from "@/components/subtrack-tooltip";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { useMemo } from "react";

export type AdminUsersViewUser = {
  id: string;
  name: string;
  surname: string;
  email: string;
  is_admin: number;
  created_at: string;
};

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
  fetchError?: string | null;
  subscriptionsFetchError?: string | null;
};

export function AdminUsersView({
  users,
  countsByUserId,
  fetchError,
  subscriptionsFetchError,
}: AdminUsersViewProps) {
  const { t, locale } = useSubtrackIntl();
  const intlLocale = useMemo(
    () => uiLocaleCodeToBcp47ForIntl(locale),
    [locale],
  );

  return (
    <div className="admin-page admin-users-page">
      <div className="admin-page-head">
        <h1 className="admin-page-title">{t("admin.users.heading")}</h1>
        <p className="admin-page-lead">
          {t("admin.users.lead_intro")}{" "}
          <code className="admin-inline-code">public.users</code>
          {t("admin.users.lead_outro")}
        </p>
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

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("admin.users.col_user")}</th>
                  <th className="admin-table-col-counts">
                    {t("admin.users.col_records")}
                  </th>
                  <th className="admin-table-col-role">
                    {t("admin.users.col_role")}
                  </th>
                  <th className="admin-table-col-registered">
                    {t("admin.users.col_registered")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <SubtrackTooltip label={fullDisplayName(u)}>
                          <span className="admin-user-avatar" aria-hidden>
                            {userAvatarInitials(u.name, u.surname, u.email)}
                          </span>
                        </SubtrackTooltip>
                        <div className="admin-user-meta">
                          <div className="admin-user-name">
                            {fullDisplayName(u)}
                          </div>
                          <div className="admin-user-email">
                            {u.email?.trim() || "–"}
                          </div>
                          <div className="admin-user-registered-mobile">
                            <span className="admin-user-meta-mobile-label">
                              {t("admin.users.col_registered")}
                            </span>
                            <span className="admin-user-meta-mobile-value">
                              {formatDateTimeIntl(u.created_at, intlLocale)}
                            </span>
                          </div>
                          <div className="admin-user-role-mobile">
                            <span className="admin-user-meta-mobile-label">
                              {t("admin.users.col_role")}
                            </span>
                            <span className="admin-user-meta-mobile-value">
                              {u.is_admin > 0 ? (
                                <span className="admin-badge admin-badge--admin">
                                  {t("admin.users.role_admin")}
                                </span>
                              ) : (
                                <span className="admin-badge">
                                  {t("admin.users.role_user")}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="admin-table-col-counts">
                      <SubscriptionCountsCell
                        t={t}
                        raw={countsByUserId?.[u.id]}
                        subsLoaded={!subscriptionsFetchError}
                      />
                    </td>
                    <td className="admin-table-col-role">
                      {u.is_admin > 0 ? (
                        <span className="admin-badge admin-badge--admin">
                          {t("admin.users.role_admin")}
                        </span>
                      ) : (
                        <span className="admin-badge">
                          {t("admin.users.role_user")}
                        </span>
                      )}
                    </td>
                    <td className="admin-table-col-registered">
                      {formatDateTimeIntl(u.created_at, intlLocale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SubscriptionCountsCell(props: {
  t: (k: string) => string;
  raw: AdminUsersCountsSerializable | undefined;
  subsLoaded: boolean;
}) {
  const { t, raw, subsLoaded } = props;

  const counts = useMemo(() => {
    if (!raw) return undefined;
    const m = new Map<SubscriptionCategory, number>();
    for (const cat of SUBSCRIPTION_CATEGORY_ORDER) {
      const v = raw[cat];
      if (typeof v === "number" && v > 0) m.set(cat, v);
    }
    return m.size ? m : undefined;
  }, [raw]);

  if (!subsLoaded) {
    return <span className="admin-sub-counts admin-sub-counts--empty">–</span>;
  }

  if (!counts || counts.size === 0) {
    return (
      <div className="admin-sub-counts">
        <span className="admin-sub-counts-total">0</span>
      </div>
    );
  }

  let total = 0;
  const parts: { cat: SubscriptionCategory; n: number }[] = [];
  for (const cat of SUBSCRIPTION_CATEGORY_ORDER) {
    const n = counts.get(cat) ?? 0;
    if (n > 0) {
      total += n;
      parts.push({ cat, n });
    }
  }

  if (parts.length === 0) {
    return (
      <div className="admin-sub-counts">
        <span className="admin-sub-counts-total">0</span>
      </div>
    );
  }

  return (
    <div className="admin-sub-counts">
      {parts.map((p, i) => (
        <span key={p.cat} className="admin-sub-counts-part">
          {i > 0 ? (
            <span aria-hidden className="admin-sub-counts-sep">
              {" "}
              ·{" "}
            </span>
          ) : null}
          {t(`subscription.category.${p.cat}`)}: <strong>{p.n}</strong>
        </span>
      ))}
      <span aria-hidden className="admin-sub-counts-sep">
        {" "}
        ·{" "}
      </span>
      <span className="admin-sub-counts-total">{total}</span>
    </div>
  );
}

function formatDateTimeIntl(iso: string, intlLocale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  }
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

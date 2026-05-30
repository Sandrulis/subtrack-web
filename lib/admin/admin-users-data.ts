import { cache } from "react";
import type { AdminUsersCountsSerializable } from "@/components/admin/admin-users-view";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeProTrialConfig } from "@/lib/auth/pro-trial-access";
import { normalizePaidPlanType } from "@/lib/billing/paid-plan-type";
import { coercePgBool } from "@/lib/system-settings-public";
import type { ProTrialConfig } from "@/lib/auth/pro-trial-access";
import type { PaidPlanType } from "@/lib/billing/paid-plan-type";

type SubscriptionCategory =
  | "subscription"
  | "bill"
  | "credit"
  | "leasing"
  | "insurance"
  | "other";

type SubCountRow = { user_id: string; category: string };

export type AdminUsersViewUserRow = {
  id: string;
  name: string;
  surname: string;
  email: string;
  is_admin: number;
  created_at: string;
  last_seen: string | null;
  paidPlanActive: boolean;
  proVip: boolean;
  paidPlanType: PaidPlanType | null;
  paidPlanAutoRenew: boolean;
  paidPlanPeriodEndAt: string | null;
  proTrialUsed: boolean;
  proTrialStartedAt: string | null;
  avatarUrl: string | null;
  stripeCustomerId: string | null;
};

export type AdminUsersPageData = {
  users: AdminUsersViewUserRow[];
  countsByUserId: Record<string, AdminUsersCountsSerializable> | null;
  paidPlanEnabled: boolean;
  proTrial: ProTrialConfig;
  currentUserId: string | null;
  fetchError: string | null;
  subscriptionsFetchError: string | null;
};

function normalizeSubscriptionCategory(
  raw: string | null | undefined,
): SubscriptionCategory {
  const k = (raw ?? "").trim();
  if (
    k === "subscription" ||
    k === "bill" ||
    k === "credit" ||
    k === "leasing" ||
    k === "insurance" ||
    k === "other"
  ) {
    return k;
  }
  return "other";
}

function aggregateSubscriptionCounts(
  rows: SubCountRow[],
): Map<string, Map<SubscriptionCategory, number>> {
  const byUser = new Map<string, Map<SubscriptionCategory, number>>();
  for (const row of rows) {
    const uid = row.user_id;
    if (!uid) continue;
    const cat = normalizeSubscriptionCategory(row.category);
    let m = byUser.get(uid);
    if (!m) {
      m = new Map();
      byUser.set(uid, m);
    }
    m.set(cat, (m.get(cat) ?? 0) + 1);
  }
  return byUser;
}

function serializeCounts(
  countsByUser: Map<string, Map<SubscriptionCategory, number>> | null,
): Record<string, AdminUsersCountsSerializable> | null {
  if (!countsByUser) return null;
  const out: Record<string, AdminUsersCountsSerializable> = {};
  for (const [uid, inner] of countsByUser) {
    const o: AdminUsersCountsSerializable = {};
    for (const [k, v] of inner) {
      if (typeof v === "number" && v > 0) (o as Record<string, number>)[k] = v;
    }
    out[uid] = o;
  }
  return out;
}

export const loadAdminUsersPageData = cache(async (): Promise<AdminUsersPageData> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  const [
    { data: rows, error },
    { data: subRows, error: subsError },
    { data: sysRow },
  ] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, name, surname, email, is_admin, created_at, last_seen, paid_plan_active, pro_vip, paid_plan_type, paid_plan_auto_renew, paid_plan_period_end_at, pro_trial_used, pro_trial_started_at, avatar_url, stripe_customer_id",
      )
      .order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("user_id, category"),
    supabase
      .from("system_settings")
      .select("paid_plan_enabled, pro_trial_enabled, pro_trial_days")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const paidPlanEnabled = coercePgBool(sysRow?.paid_plan_enabled);
  const proTrial = normalizeProTrialConfig(sysRow);
  const listRaw = rows ?? [];

  type UserRowDb = (typeof listRaw)[number] & {
    paid_plan_active?: boolean | null;
    pro_vip?: boolean | null;
  };

  const users = (listRaw as UserRowDb[]).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    surname: r.surname ?? "",
    email: r.email ?? "",
    is_admin:
      typeof r.is_admin === "number"
        ? r.is_admin
        : Number.parseInt(String(r.is_admin ?? 0), 10) || 0,
    created_at: r.created_at ?? "",
    last_seen:
      typeof (r as { last_seen?: unknown }).last_seen === "string"
        ? (r as { last_seen: string }).last_seen
        : null,
    paidPlanActive: r.paid_plan_active === true,
    proVip: r.pro_vip === true,
    paidPlanType: normalizePaidPlanType(
      (r as { paid_plan_type?: unknown }).paid_plan_type,
    ),
    paidPlanAutoRenew: (r as { paid_plan_auto_renew?: unknown }).paid_plan_auto_renew === true,
    paidPlanPeriodEndAt:
      typeof (r as { paid_plan_period_end_at?: unknown }).paid_plan_period_end_at ===
      "string"
        ? (r as { paid_plan_period_end_at: string }).paid_plan_period_end_at
        : null,
    proTrialUsed: (r as { pro_trial_used?: unknown }).pro_trial_used === true,
    proTrialStartedAt:
      typeof (r as { pro_trial_started_at?: unknown }).pro_trial_started_at === "string"
        ? (r as { pro_trial_started_at: string }).pro_trial_started_at
        : null,
    avatarUrl:
      typeof (r as { avatar_url?: unknown }).avatar_url === "string"
        ? (r as { avatar_url: string }).avatar_url.trim() || null
        : null,
    stripeCustomerId:
      typeof (r as { stripe_customer_id?: unknown }).stripe_customer_id === "string"
        ? (r as { stripe_customer_id: string }).stripe_customer_id.trim() || null
        : null,
  }));

  const countsByUser = subsError
    ? null
    : aggregateSubscriptionCounts((subRows ?? []) as SubCountRow[]);

  return {
    users,
    countsByUserId: serializeCounts(countsByUser),
    paidPlanEnabled,
    proTrial,
    currentUserId: sessionUser?.id ?? null,
    fetchError: error?.message ?? null,
    subscriptionsFetchError: subsError?.message ?? null,
  };
});

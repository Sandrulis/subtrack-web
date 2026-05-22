import type { Metadata } from "next";
import {
  AdminUsersView,
  type AdminUsersCountsSerializable,
} from "@/components/admin/admin-users-view";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { coercePgBool } from "@/lib/system-settings-public";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.users"),
  };
}

type SubscriptionCategory =
  | "subscription"
  | "bill"
  | "credit"
  | "leasing"
  | "insurance"
  | "other";

type SubCountRow = { user_id: string; category: string };

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

export default async function AdminUsersPage() {
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
        "id, name, surname, email, is_admin, created_at, paid_plan_active, pro_vip, avatar_url",
      )
      .order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("user_id, category"),
    supabase
      .from("system_settings")
      .select("paid_plan_enabled")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const paidPlanEnabled = coercePgBool(sysRow?.paid_plan_enabled);

  const listRaw = rows ?? [];
  type UserRowDb = (typeof listRaw)[number] & {
    paid_plan_active?: boolean | null;
    pro_vip?: boolean | null;
  };

  const list = (listRaw as UserRowDb[]).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    surname: r.surname ?? "",
    email: r.email ?? "",
    is_admin:
      typeof r.is_admin === "number"
        ? r.is_admin
        : Number.parseInt(String(r.is_admin ?? 0), 10) || 0,
    created_at: r.created_at ?? "",
    paidPlanActive: r.paid_plan_active === true,
    proVip: r.pro_vip === true,
    avatarUrl:
      typeof (r as { avatar_url?: unknown }).avatar_url === "string"
        ? (r as { avatar_url: string }).avatar_url.trim() || null
        : null,
  }));
  const countsByUser = subsError
    ? null
    : aggregateSubscriptionCounts((subRows ?? []) as SubCountRow[]);

  return (
    <AdminUsersView
      users={list}
      countsByUserId={serializeCounts(countsByUser)}
      paidPlanEnabled={paidPlanEnabled}
      currentUserId={sessionUser?.id ?? null}
      fetchError={error?.message ?? null}
      subscriptionsFetchError={subsError?.message ?? null}
    />
  );
}

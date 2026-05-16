import type { Metadata } from "next";
import {
  AdminUsersView,
  type AdminUsersCountsSerializable,
} from "@/components/admin/admin-users-view";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getUiPhraseForRequest("meta.title.admin.users"),
  };
}

type UserRow = {
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

  const [
    { data: rows, error },
    { data: subRows, error: subsError },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, surname, email, is_admin, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("user_id, category"),
  ]);

  const list = (rows ?? []) as UserRow[];
  const countsByUser = subsError
    ? null
    : aggregateSubscriptionCounts((subRows ?? []) as SubCountRow[]);

  return (
    <AdminUsersView
      users={list}
      countsByUserId={serializeCounts(countsByUser)}
      fetchError={error?.message ?? null}
      subscriptionsFetchError={subsError?.message ?? null}
    />
  );
}

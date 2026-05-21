import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
import type {
  FamilySharingDashboardBootstrap,
  FamilySharingLinkClient,
  FamilySharingLinkStatus,
  FamilyShareMeta,
  SubscriptionWithFamilyShare,
} from "@/lib/family-sharing/family-sharing-types";
import { mapSubscriptionRowToClient } from "@/lib/subscriptions/subscription-map";
import type { SubscriptionRow } from "@/lib/subscriptions/subscription-client";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";

const COLOR_RE = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeInviteEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidInviteEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function normalizePartnerColor(raw: string, fallback = "#f59e0b"): string {
  const t = raw.trim();
  if (COLOR_RE.test(t)) return t;
  return fallback;
}

type LinkRow = {
  id: string;
  owner_user_id: string;
  partner_user_id: string | null;
  invite_email: string;
  status: string;
  partner_display_color: string;
  combine_in_totals: boolean;
};

function partnerLabelFromRow(
  row: LinkRow,
  partnerNames: Map<string, string>,
): string {
  if (row.partner_user_id) {
    const n = partnerNames.get(row.partner_user_id);
    if (n) return n;
  }
  return row.invite_email;
}

async function loadPartnerNames(
  partnerIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!partnerIds.length) return out;
  try {
    const admin = createServiceRoleSupabaseClient();
    if (!admin) return out;
    const { data } = await admin
      .from("users")
      .select("id, name, surname, email")
      .in("id", partnerIds);
    for (const u of data ?? []) {
      const id = String(u.id);
      const name = [u.name, u.surname].filter(Boolean).join(" ").trim();
      out.set(id, name || String(u.email ?? "").trim() || id);
    }
  } catch {
    /* ignore */
  }
  return out;
}

export async function fetchFamilySharingLinksForSession(): Promise<
  FamilySharingLinkClient[]
> {
  const { supabase, user } = await loadAuthContext();
  if (!user) return [];

  const { data, error } = await supabase
    .from("family_sharing_links")
    .select(
      "id, owner_user_id, partner_user_id, invite_email, status, partner_display_color, combine_in_totals",
    )
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const rows = data as LinkRow[];
  const partnerIds = rows
    .map((r) => r.partner_user_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const ownerIds = rows
    .map((r) => r.owner_user_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const partnerNames = await loadPartnerNames([...new Set([...partnerIds, ...ownerIds])]);

  const out: FamilySharingLinkClient[] = [];
  for (const row of rows) {
    const isOwner = row.owner_user_id === user.id;
    const isIncoming =
      !isOwner &&
      row.status === "pending" &&
      normalizeInviteEmail(row.invite_email) === normalizeInviteEmail(user.email ?? "");

    if (!isOwner && !isIncoming && row.partner_user_id !== user.id) {
      continue;
    }

    out.push({
      id: row.id,
      inviteEmail: row.invite_email,
      status: row.status as FamilySharingLinkStatus,
      partnerUserId: row.partner_user_id,
      partnerLabel: isIncoming
        ? partnerNames.get(row.owner_user_id) ?? row.invite_email
        : partnerLabelFromRow(row, partnerNames),
      partnerDisplayColor: normalizePartnerColor(row.partner_display_color),
      combineInTotals: row.combine_in_totals === true,
      isIncoming,
    });
  }
  return out;
}

export async function fetchFamilySharingDashboardBootstrap(): Promise<FamilySharingDashboardBootstrap> {
  const enabled = await isIntegrationEnabled("family_sharing");
  if (!enabled) {
    return { enabled: false, links: [] };
  }
  const links = await fetchFamilySharingLinksForSession();
  return { enabled: true, links };
}

export async function fetchDashboardSubscriptionsWithFamilyShare(): Promise<{
  subscriptions: SubscriptionWithFamilyShare[];
  familyBootstrap: FamilySharingDashboardBootstrap;
}> {
  const { supabase, user } = await loadAuthContext();
  const familyBootstrap = await fetchFamilySharingDashboardBootstrap();

  if (!user) {
    return { subscriptions: [], familyBootstrap };
  }

  const { data: ownRaw, error: ownErr } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("next_payment_date", { ascending: true });

  const own: SubscriptionWithFamilyShare[] =
    !ownErr && ownRaw
      ? (ownRaw as SubscriptionRow[]).map((r) => mapSubscriptionRowToClient(r))
      : [];

  const activeOutgoing = familyBootstrap.links.filter(
    (l) => !l.isIncoming && l.status === "active" && l.partnerUserId,
  );

  if (!activeOutgoing.length) {
    return { subscriptions: own, familyBootstrap };
  }

  const shared: SubscriptionWithFamilyShare[] = [];
  for (const link of activeOutgoing) {
    const pid = link.partnerUserId;
    if (!pid) continue;
    const { data: partnerSubs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", pid)
      .order("next_payment_date", { ascending: true });

    const meta: FamilyShareMeta = {
      linkId: link.id,
      partnerUserId: pid,
      partnerLabel: link.partnerLabel,
      tintColor: link.partnerDisplayColor,
    };

    for (const row of (partnerSubs ?? []) as SubscriptionRow[]) {
      const base = mapSubscriptionRowToClient(row);
      shared.push({
        ...base,
        familyShare: meta,
        readOnly: true,
      });
    }
  }

  return { subscriptions: [...own, ...shared], familyBootstrap };
}

export async function lookupUserIdByEmail(email: string): Promise<string | null> {
  const norm = normalizeInviteEmail(email);
  if (!isValidInviteEmail(norm)) return null;
  try {
    const admin = createServiceRoleSupabaseClient();
    if (!admin) return null;
    const { data } = await admin
      .from("users")
      .select("id")
      .eq("email", norm)
      .maybeSingle();
    return data?.id ? String(data.id) : null;
  } catch {
    return null;
  }
}

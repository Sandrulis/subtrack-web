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
      ownerUserId: row.owner_user_id,
      inviteEmail: row.invite_email,
      status: row.status as FamilySharingLinkStatus,
      partnerUserId: row.partner_user_id,
      partnerLabel: isIncoming
        ? partnerNames.get(row.owner_user_id) ?? row.invite_email
        : isOwner
          ? partnerLabelFromRow(row, partnerNames)
          : partnerNames.get(row.owner_user_id) ?? row.invite_email,
      partnerDisplayColor: normalizePartnerColor(row.partner_display_color),
      combineInTotals: row.combine_in_totals === true,
      isOwner,
      isIncoming,
    });
  }
  return out;
}

export async function fetchFamilySharingDashboardBootstrap(): Promise<FamilySharingDashboardBootstrap> {
  const enabled = await isIntegrationEnabled("family_sharing");
  const { user } = await loadAuthContext();
  if (!enabled) {
    return { enabled: false, viewerUserId: user?.id, links: [] };
  }
  const links = await fetchFamilySharingLinksForSession();
  return { enabled: true, viewerUserId: user?.id, links };
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

  const activeLinks = familyBootstrap.links.filter(
    (l) => l.status === "active" && l.partnerUserId,
  );

  if (!activeLinks.length) {
    return { subscriptions: own, familyBootstrap };
  }

  const shared: SubscriptionWithFamilyShare[] = [];
  const seenIds = new Set(own.map((s) => String(s.id)));

  const inviterIds = [
    ...new Set(
      activeLinks
        .filter(
          (l) =>
            !l.isOwner &&
            l.partnerUserId === user.id &&
            l.ownerUserId !== user.id,
        )
        .map((l) => l.ownerUserId),
    ),
  ];
  const inviterNames =
    inviterIds.length > 0 ? await loadPartnerNames(inviterIds) : new Map<string, string>();

  for (const link of activeLinks) {
    let sharedOwnerId: string | null = null;
    let sharedLabel = link.partnerLabel;

    if (link.isOwner && link.partnerUserId !== user.id) {
      sharedOwnerId = link.partnerUserId;
    } else if (
      !link.isOwner &&
      link.partnerUserId === user.id &&
      link.ownerUserId !== user.id
    ) {
      sharedOwnerId = link.ownerUserId;
      sharedLabel =
        inviterNames.get(link.ownerUserId) ?? link.inviteEmail;
    }

    if (!sharedOwnerId || sharedOwnerId === user.id) continue;

    const { data: sharedSubs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", sharedOwnerId)
      .order("next_payment_date", { ascending: true });

    const meta: FamilyShareMeta = {
      linkId: link.id,
      partnerUserId: sharedOwnerId,
      partnerLabel: sharedLabel,
      tintColor: link.partnerDisplayColor,
    };

    for (const row of (sharedSubs ?? []) as SubscriptionRow[]) {
      const id = String(row.id);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
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

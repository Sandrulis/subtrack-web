import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
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

/** E-pasts uzaicinājumu saskaņošanai: `public.users` (kā RLS), ne tikai Auth JWT. */
export async function resolveInviteEmailForUser(
  supabase: SupabaseClient,
  user: User,
): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();
  const fromDb = typeof data?.email === "string" ? data.email.trim() : "";
  return normalizeInviteEmail(fromDb || user.email || "");
}

export function normalizePartnerColor(raw: string, fallback = "#f59e0b"): string {
  const t = raw.trim();
  if (COLOR_RE.test(t)) return t;
  return fallback;
}

const FAMILY_LINK_SELECT_WITH_TINT =
  "id, owner_user_id, partner_user_id, invite_email, status, partner_display_color, partner_tint_color, combine_in_totals";
const FAMILY_LINK_SELECT_BASE =
  "id, owner_user_id, partner_user_id, invite_email, status, partner_display_color, combine_in_totals";

type LinkRow = {
  id: string;
  owner_user_id: string;
  partner_user_id: string | null;
  invite_email: string;
  status: string;
  partner_display_color: string;
  partner_tint_color?: string | null;
  combine_in_totals: boolean;
};

function userIdsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function normalizeLinkStatus(raw: string): FamilySharingLinkStatus {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "active" || s === "pending" || s === "revoked") return s;
  return "pending";
}

function isMissingTintColumnError(error: { message?: string; code?: string }): boolean {
  const msg = String(error.message ?? "").toLowerCase();
  return msg.includes("partner_tint_color") || error.code === "42703";
}

/**
 * Lasīšana ar service_role (ja ENV ir), pēc tam filtrs serverī pēc lietotāja.
 * Novērš Vercel/prod RLS, kur sesija redz tikai daļu saites (bez 093 vai vecs SELECT).
 */
async function fetchFamilySharingLinkRowsForViewer(
  sessionSupabase: SupabaseClient,
): Promise<LinkRow[]> {
  const admin = createServiceRoleSupabaseClient();
  if (admin) {
    return fetchFamilySharingLinkRows(admin);
  }
  return fetchFamilySharingLinkRows(sessionSupabase);
}

async function fetchFamilySharingLinkRows(
  supabase: SupabaseClient,
): Promise<LinkRow[]> {
  const baseQuery = () =>
    supabase
      .from("family_sharing_links")
      .select(FAMILY_LINK_SELECT_WITH_TINT)
      .neq("status", "revoked")
      .order("created_at", { ascending: false });

  const full = await baseQuery();
  if (!full.error) {
    return (full.data ?? []) as LinkRow[];
  }
  if (!isMissingTintColumnError(full.error)) {
    return [];
  }

  const fallback = await supabase
    .from("family_sharing_links")
    .select(FAMILY_LINK_SELECT_BASE)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  if (fallback.error) {
    return [];
  }

  return (fallback.data ?? []).map((row) => {
    const r = row as Omit<LinkRow, "partner_tint_color">;
    return {
      ...r,
      partner_tint_color: r.partner_display_color,
    };
  });
}

function panelColorForViewer(row: LinkRow, viewerId: string): string {
  if (userIdsEqual(row.owner_user_id, viewerId)) {
    return normalizePartnerColor(row.partner_display_color);
  }
  if (userIdsEqual(row.partner_user_id, viewerId)) {
    return normalizePartnerColor(
      row.partner_tint_color ?? row.partner_display_color,
    );
  }
  return normalizePartnerColor(row.partner_display_color);
}

type UserProfile = { label: string; email: string };

function partnerLabelFromRow(row: LinkRow, profiles: Map<string, UserProfile>): string {
  if (row.partner_user_id) {
    const p = profiles.get(row.partner_user_id);
    if (p?.label) return p.label;
  }
  return row.invite_email;
}

function profileEmail(profiles: Map<string, UserProfile>, userId: string): string {
  return normalizeInviteEmail(profiles.get(userId)?.email ?? "");
}

/**
 * Partnera/owner kopīgie abonementi dashboardam – service_role (ja ENV),
 * tikai pēc aktīvās saites validācijas serverī (RLS EXISTS uz links bieži tukšs Vercel).
 */
async function fetchSubscriptionsForFamilyShareCounterparty(
  sessionSupabase: SupabaseClient,
  counterpartyUserId: string,
): Promise<SubscriptionRow[]> {
  const admin = createServiceRoleSupabaseClient();
  const client = admin ?? sessionSupabase;
  const { data, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("user_id", counterpartyUserId)
    .order("next_payment_date", { ascending: true });
  if (error) {
    return [];
  }
  return (data ?? []) as SubscriptionRow[];
}

async function loadUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
  const out = new Map<string, UserProfile>();
  if (!userIds.length) return out;
  try {
    const admin = createServiceRoleSupabaseClient();
    if (!admin) return out;
    const { data } = await admin
      .from("users")
      .select("id, name, surname, email")
      .in("id", userIds);
    for (const u of data ?? []) {
      const id = String(u.id);
      const email = normalizeInviteEmail(String(u.email ?? ""));
      const name = [u.name, u.surname].filter(Boolean).join(" ").trim();
      out.set(id, { label: name || email || id, email });
    }
  } catch {
    /* ignore */
  }
  return out;
}

export type FamilySharingAuthSession = {
  supabase: SupabaseClient;
  user: User;
};

export async function fetchFamilySharingLinksForSession(
  session?: FamilySharingAuthSession | null,
): Promise<FamilySharingLinkClient[]> {
  let supabase: SupabaseClient;
  let user: User | null;
  if (session) {
    supabase = session.supabase;
    user = session.user;
  } else {
    const ctx = await loadAuthContext();
    supabase = ctx.supabase;
    user = ctx.user;
  }
  if (!user) return [];

  const rows = await fetchFamilySharingLinkRowsForViewer(supabase);
  if (!rows.length) return [];

  const sessionEmail = await resolveInviteEmailForUser(supabase, user);
  const authEmail = normalizeInviteEmail(user.email ?? "");
  const partnerIds = rows
    .map((r) => r.partner_user_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const ownerIds = rows
    .map((r) => r.owner_user_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const profiles = await loadUserProfiles([...new Set([...partnerIds, ...ownerIds])]);

  const out: FamilySharingLinkClient[] = [];
  for (const row of rows) {
    const status = normalizeLinkStatus(row.status);
    const isOwner = userIdsEqual(row.owner_user_id, user.id);
    const isInvitedParty =
      userIdsEqual(row.partner_user_id, user.id) ||
      normalizeInviteEmail(row.invite_email) === sessionEmail ||
      (authEmail.length > 0 &&
        normalizeInviteEmail(row.invite_email) === authEmail);
    const isIncoming = !isOwner && status === "pending" && isInvitedParty;

    if (!isOwner && !isInvitedParty) {
      continue;
    }

    out.push({
      id: row.id,
      ownerUserId: row.owner_user_id,
      inviteEmail: row.invite_email,
      status,
      partnerUserId: row.partner_user_id,
      partnerLabel: isIncoming
        ? profiles.get(row.owner_user_id)?.label ?? row.invite_email
        : isOwner
          ? partnerLabelFromRow(row, profiles)
          : profiles.get(row.owner_user_id)?.label ?? row.invite_email,
      counterpartyEmail: isIncoming
        ? profileEmail(profiles, row.owner_user_id)
        : isOwner
          ? normalizeInviteEmail(row.invite_email)
          : profileEmail(profiles, row.owner_user_id),
      partnerDisplayColor: panelColorForViewer(row, user.id),
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
  const inviterProfiles =
    inviterIds.length > 0 ? await loadUserProfiles(inviterIds) : new Map<string, UserProfile>();

  for (const link of activeLinks) {
    let sharedOwnerId: string | null = null;
    let sharedLabel = link.partnerLabel;

    if (link.isOwner && !userIdsEqual(link.partnerUserId, user.id)) {
      sharedOwnerId = link.partnerUserId;
    } else if (
      !link.isOwner &&
      userIdsEqual(link.partnerUserId, user.id) &&
      !userIdsEqual(link.ownerUserId, user.id)
    ) {
      sharedOwnerId = link.ownerUserId;
      sharedLabel =
        inviterProfiles.get(link.ownerUserId)?.label ?? link.inviteEmail;
    }

    if (!sharedOwnerId || userIdsEqual(sharedOwnerId, user.id)) continue;

    const sharedSubs = await fetchSubscriptionsForFamilyShareCounterparty(
      supabase,
      sharedOwnerId,
    );

    const meta: FamilyShareMeta = {
      linkId: link.id,
      partnerUserId: sharedOwnerId,
      partnerLabel: sharedLabel,
      tintColor: link.partnerDisplayColor,
    };

    for (const row of sharedSubs) {
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
      .select("id, email")
      .ilike("email", norm)
      .maybeSingle();
    if (data?.id) {
      return String(data.id);
    }
    const { data: exact } = await admin
      .from("users")
      .select("id")
      .eq("email", norm)
      .maybeSingle();
    return exact?.id ? String(exact.id) : null;
  } catch {
    return null;
  }
}

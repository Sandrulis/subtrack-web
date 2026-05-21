import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeInviteEmail,
  normalizePartnerColor,
  resolveInviteEmailForUser,
} from "@/lib/family-sharing/family-sharing-server";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

function userIdsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function normalizeLinkStatus(raw: string): string {
  return String(raw ?? "").trim().toLowerCase();
}

async function requireSessionUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }
  return { supabase, user };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteCtx = { params: Promise<{ id: string }> };

type LinkRow = {
  id: string;
  owner_user_id: string;
  partner_user_id: string | null;
  status: string;
  invite_email: string;
};

export async function PATCH(request: Request, ctx: RouteCtx) {
  const session = await requireSessionUser();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const { supabase, user } = session;

  if (!(await isIntegrationEnabled("family_sharing"))) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("family_sharing.err_disabled"),
      },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const rec =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const patch: Record<string, unknown> = {};
  if (rec.combineInTotals !== undefined) {
    patch.combine_in_totals =
      rec.combineInTotals === true || rec.combineInTotals === "true";
  }
  if (rec.action === "accept") {
    patch.status = "active";
    patch.accepted_at = new Date().toISOString();
    patch.partner_user_id = user.id;
  }
  if (rec.action === "revoke" || rec.action === "leave" || rec.action === "decline") {
    patch.status = "revoked";
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("family_sharing_links")
    .select("id, owner_user_id, partner_user_id, status, invite_email")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json(
      { success: false, message: fetchErr.message ?? "Failed" },
      { status: 500 },
    );
  }
  if (!existing) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  const row = existing as LinkRow;
  const linkStatus = normalizeLinkStatus(row.status);
  const userEmail = await resolveInviteEmailForUser(supabase, user);
  const authEmail = normalizeInviteEmail(user.email ?? "");
  const isOwner = userIdsEqual(row.owner_user_id, user.id);
  const isPartner =
    userIdsEqual(row.partner_user_id, user.id) ||
    (linkStatus === "active" &&
      !isOwner &&
      (normalizeInviteEmail(row.invite_email) === userEmail ||
        (authEmail.length > 0 &&
          normalizeInviteEmail(row.invite_email) === authEmail)));

  if (rec.color !== undefined) {
    const color = normalizePartnerColor(String(rec.color));
    if (isOwner && linkStatus === "active") {
      patch.partner_display_color = color;
    } else if (isPartner && linkStatus === "active") {
      patch.partner_tint_color = color;
    } else {
      return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ success: false, message: "No fields" }, { status: 400 });
  }

  if (rec.action === "accept") {
    if (linkStatus !== "pending") {
      return NextResponse.json(
        { success: false, message: "Invite is not pending" },
        { status: 400 },
      );
    }
    const mayAccept =
      userIdsEqual(row.partner_user_id, user.id) ||
      normalizeInviteEmail(row.invite_email) === userEmail ||
      (authEmail.length > 0 && normalizeInviteEmail(row.invite_email) === authEmail);
    if (!mayAccept) {
      return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
    }
  } else if (rec.action === "decline") {
    if (linkStatus !== "pending") {
      return NextResponse.json(
        { success: false, message: "Invite is not pending" },
        { status: 400 },
      );
    }
    const mayDecline =
      userIdsEqual(row.partner_user_id, user.id) ||
      normalizeInviteEmail(row.invite_email) === userEmail ||
      (authEmail.length > 0 && normalizeInviteEmail(row.invite_email) === authEmail);
    if (!mayDecline) {
      return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
    }
  } else if (rec.action === "leave") {
    if (!isPartner) {
      return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
    }
    if (linkStatus !== "active") {
      return NextResponse.json(
        { success: false, message: "Sharing is not active" },
        { status: 400 },
      );
    }
  } else if (
    isPartner &&
    linkStatus === "active" &&
    rec.action === undefined &&
    (rec.color !== undefined || rec.combineInTotals !== undefined)
  ) {
    /* partneris: sava krāsa vai summēšanas slēdzis */
  } else if (rec.action === "revoke" && !isOwner) {
    return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
  } else if (!isOwner && !isPartner && rec.action !== "decline") {
    return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
  } else if (linkStatus === "revoked" && rec.action !== "revoke") {
    return NextResponse.json(
      { success: false, message: "Link is revoked" },
      { status: 400 },
    );
  }

  const isStateAction =
    rec.action === "accept" ||
    rec.action === "decline" ||
    rec.action === "revoke" ||
    rec.action === "leave";
  const isMetaUpdate =
    rec.action === undefined &&
    (rec.color !== undefined || rec.combineInTotals !== undefined);

  let updateClient: SupabaseClient = supabase;
  if (isStateAction || isMetaUpdate) {
    const admin = createServiceRoleSupabaseClient();
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error (service role)",
        },
        { status: 500 },
      );
    }
    updateClient = admin;
  }

  let updateQuery = updateClient.from("family_sharing_links").update(patch).eq("id", id);

  if (rec.action === "accept") {
    updateQuery = updateQuery.eq("status", "pending");
  } else if (rec.action === "decline") {
    updateQuery = updateQuery.eq("status", "pending");
  } else if (rec.action === "leave") {
    updateQuery = updateQuery.eq("status", "active");
    if (row.partner_user_id) {
      updateQuery = updateQuery.eq("partner_user_id", user.id);
    }
  } else if (isPartner && isMetaUpdate) {
    updateQuery = updateQuery.eq("status", "active");
    if (row.partner_user_id && userIdsEqual(row.partner_user_id, user.id)) {
      updateQuery = updateQuery.eq("partner_user_id", user.id);
    }
  } else if (isOwner && isMetaUpdate) {
    updateQuery = updateQuery.eq("owner_user_id", user.id).eq("status", "active");
  } else if (isOwner) {
    updateQuery = updateQuery.eq("owner_user_id", user.id);
  } else {
    return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
  }

  try {
    const { data: updated, error: updateErr } = await updateQuery.select("id").maybeSingle();

    if (updateErr) {
      console.error("[PATCH /api/family-sharing/:id] update", updateErr);
      const msg = String(updateErr.message ?? "Failed");
      const hint =
        msg.includes("partner_tint_color") || msg.includes("42703")
          ? " (run migration 091_family_sharing_partner_tint_color.sql)"
          : "";
      return NextResponse.json(
        { success: false, message: msg + hint },
        { status: 500 },
      );
    }
    if (!updated?.id) {
      return NextResponse.json(
        { success: false, message: "Update failed or not allowed" },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/family-sharing/:id]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

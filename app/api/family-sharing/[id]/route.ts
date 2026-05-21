import { NextResponse } from "next/server";
import {
  normalizeInviteEmail,
  normalizePartnerColor,
} from "@/lib/family-sharing/family-sharing-server";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

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
  if (rec.color !== undefined) {
    patch.partner_display_color = normalizePartnerColor(String(rec.color));
  }
  if (rec.combineInTotals !== undefined) {
    patch.combine_in_totals =
      rec.combineInTotals === true || rec.combineInTotals === "true";
  }
  if (rec.action === "accept") {
    patch.status = "active";
    patch.accepted_at = new Date().toISOString();
    patch.partner_user_id = user.id;
  }
  if (rec.action === "revoke" || rec.action === "leave") {
    patch.status = "revoked";
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ success: false, message: "No fields" }, { status: 400 });
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
  const userEmail = normalizeInviteEmail(user.email ?? "");

  if (rec.action === "accept") {
    if (row.status !== "pending") {
      return NextResponse.json(
        { success: false, message: "Invite is not pending" },
        { status: 400 },
      );
    }
    if (normalizeInviteEmail(row.invite_email) !== userEmail) {
      return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
    }
  } else if (rec.action === "leave") {
    if (row.partner_user_id !== user.id) {
      return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
    }
    if (row.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Sharing is not active" },
        { status: 400 },
      );
    }
  } else if (
    row.partner_user_id === user.id &&
    row.status === "active" &&
    rec.action === undefined &&
    rec.color === undefined &&
    rec.combineInTotals !== undefined
  ) {
    /* partneris: tikai summēšanas slēdzis */
  } else if (row.owner_user_id !== user.id) {
    return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
  } else if (row.status === "revoked" && rec.action !== "revoke") {
    return NextResponse.json(
      { success: false, message: "Link is revoked" },
      { status: 400 },
    );
  }

  let updateQuery = supabase.from("family_sharing_links").update(patch).eq("id", id);

  if (rec.action === "accept") {
    updateQuery = updateQuery.eq("status", "pending");
  } else if (rec.action === "leave") {
    updateQuery = updateQuery.eq("partner_user_id", user.id).eq("status", "active");
  } else if (
    row.partner_user_id === user.id &&
    rec.color === undefined &&
    rec.combineInTotals !== undefined
  ) {
    updateQuery = updateQuery.eq("partner_user_id", user.id).eq("status", "active");
  } else {
    updateQuery = updateQuery.eq("owner_user_id", user.id);
  }

  const { error: updateErr } = await updateQuery;

  if (updateErr) {
    return NextResponse.json(
      { success: false, message: updateErr.message ?? "Failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

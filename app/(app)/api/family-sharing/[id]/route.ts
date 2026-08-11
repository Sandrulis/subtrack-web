import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { apiJsonError } from "@/lib/api/json-response";
import { asJsonRecord, parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";
import { isValidUuid } from "@/lib/validation/uuid";
import {
  normalizeInviteEmail,
  normalizePartnerColor,
  resolveInviteEmailForUser,
} from "@/lib/family-sharing/family-sharing-server";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

function userIdsEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function normalizeLinkStatus(raw: string): string {
  return String(raw ?? "").trim().toLowerCase();
}

function isMissingTintColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("partner_tint_color") || m.includes("42703");
}

type UpdateQueryBuilder = (
  client: SupabaseClient,
) => ReturnType<ReturnType<SupabaseClient["from"]>["update"]>;

async function runLinkUpdate(
  clients: SupabaseClient[],
  buildQuery: UpdateQueryBuilder,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  let lastMessage = "Failed";
  for (const client of clients) {
    const { data, error } = await buildQuery(client).select("id").maybeSingle();
    if (!error && data?.id) {
      return { ok: true, id: data.id };
    }
    if (error) {
      lastMessage = error.message ?? lastMessage;
    }
  }
  return { ok: false, message: lastMessage };
}

type RouteCtx = { params: Promise<{ id: string }> };

type LinkRow = {
  id: string;
  owner_user_id: string;
  partner_user_id: string | null;
  status: string;
  invite_email: string;
};

export async function PATCH(request: Request, ctx: RouteCtx) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  if (!(await isIntegrationEnabled("family_sharing"))) {
    return apiJsonError(
      403,
      await getUiPhraseForRequest("family_sharing.err_disabled"),
    );
  }

  const { id } = await ctx.params;
  if (!isValidUuid(id)) {
    return apiJsonError(400, "Invalid id");
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const rec = asJsonRecord(parsedBody.body);

  const patch: Record<string, unknown> = {};
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

  if (rec.combineInTotals !== undefined) {
    const combineVal =
      rec.combineInTotals === true || rec.combineInTotals === "true";
    if (isOwner && linkStatus === "active") {
      patch.owner_combine_in_totals = combineVal;
    } else if (isPartner && linkStatus === "active") {
      patch.partner_combine_in_totals = combineVal;
    } else {
      return NextResponse.json({ success: false, message: "Not allowed" }, { status: 403 });
    }
  }

  const metaPatch = { ...patch };

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

  const admin = createServiceRoleSupabaseClient();
  /** Vispirms sesija (RLS); service_role tikai kā fallback state darbībām. */
  const updateClients: SupabaseClient[] = [supabase];
  if ((isStateAction || isMetaUpdate) && admin) {
    updateClients.push(admin);
  }

  if (isStateAction && !admin) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Server configuration error: set SUPABASE_SERVICE_ROLE_KEY on Vercel (Production).",
      },
      { status: 500 },
    );
  }

  const inviteEmailNorm = normalizeInviteEmail(row.invite_email);

  const buildQuery: UpdateQueryBuilder = (client) => {
    let q = client.from("family_sharing_links").update(patch).eq("id", id);
    if (rec.action === "accept") {
      /* service_role fallback: piesaisti invite_email / partneri, ne tikai id. */
      q = q.eq("status", "pending").eq("invite_email", inviteEmailNorm);
      if (row.partner_user_id) {
        q = q.eq("partner_user_id", user.id);
      }
    } else if (rec.action === "decline") {
      q = q.eq("status", "pending").eq("invite_email", inviteEmailNorm);
      if (row.partner_user_id) {
        q = q.eq("partner_user_id", user.id);
      }
    } else if (rec.action === "leave") {
      q = q.eq("status", "active");
      if (row.partner_user_id) {
        q = q.eq("partner_user_id", user.id);
      } else {
        q = q.eq("invite_email", inviteEmailNorm);
      }
    } else if (isPartner && isMetaUpdate) {
      q = q.eq("status", "active");
      if (row.partner_user_id && userIdsEqual(row.partner_user_id, user.id)) {
        q = q.eq("partner_user_id", user.id);
      } else {
        q = q.eq("invite_email", inviteEmailNorm);
      }
    } else if (isOwner && isMetaUpdate) {
      q = q.eq("owner_user_id", user.id).eq("status", "active");
    } else if (isOwner) {
      q = q.eq("owner_user_id", user.id);
    }
    return q;
  };

  try {
    let result = await runLinkUpdate(updateClients, buildQuery);

    if (
      !result.ok &&
      isMetaUpdate &&
      isPartner &&
      metaPatch.partner_tint_color !== undefined &&
      isMissingTintColumnError(result.message)
    ) {
      const fallbackPatch = { ...metaPatch };
      delete fallbackPatch.partner_tint_color;
      if (Object.keys(fallbackPatch).length > 0) {
        const fallbackBuilder: UpdateQueryBuilder = (client) => {
          let q = client
            .from("family_sharing_links")
            .update(fallbackPatch)
            .eq("id", id)
            .eq("status", "active");
          if (row.partner_user_id && userIdsEqual(row.partner_user_id, user.id)) {
            q = q.eq("partner_user_id", user.id);
          }
          return q;
        };
        result = await runLinkUpdate(updateClients, fallbackBuilder);
      }
    }

    if (!result.ok) {
      const msg = result.message;
      let hint = "";
      if (isMissingTintColumnError(msg)) {
        hint = " Palaid Supabase migrāciju 091_family_sharing_partner_tint_color.sql.";
      } else if (msg.includes("family_sharing_links:")) {
        hint = " Palaid migrācijas 092–094 uz produkcijas Supabase.";
      } else if (!admin && isMetaUpdate) {
        hint =
          " Vercel: pievieno SUPABASE_SERVICE_ROLE_KEY (Production) un redeploy.";
      }
      return NextResponse.json(
        { success: false, message: msg + hint },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

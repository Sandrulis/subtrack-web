import { NextResponse } from "next/server";
import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { normalizePartnerColor } from "@/lib/family-sharing/family-sharing-server";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: RouteCtx) {
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
  }
  if (rec.action === "revoke") {
    patch.status = "revoked";
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ success: false, message: "No fields" }, { status: 400 });
  }

  const { supabase, user } = await loadAuthContext();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (rec.action === "accept") {
    patch.partner_user_id = user.id;
    const { error } = await supabase
      .from("family_sharing_links")
      .update(patch)
      .eq("id", id)
      .eq("status", "pending");

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message ?? "Failed" },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true });
  }

  if (rec.action === "revoke") {
    const { error } = await supabase
      .from("family_sharing_links")
      .update(patch)
      .eq("id", id)
      .eq("owner_user_id", user.id);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message ?? "Failed" },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("family_sharing_links")
    .update(patch)
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .eq("status", "active");

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message ?? "Failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

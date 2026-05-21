import { NextResponse } from "next/server";
import { loadAuthContext } from "@/lib/auth/load-auth-context";
import {
  fetchFamilySharingLinksForSession,
  isValidInviteEmail,
  lookupUserIdByEmail,
  normalizeInviteEmail,
  normalizePartnerColor,
} from "@/lib/family-sharing/family-sharing-server";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function GET() {
  const enabled = await isIntegrationEnabled("family_sharing");
  if (!enabled) {
    return NextResponse.json({ success: true, enabled: false, links: [] });
  }
  const links = await fetchFamilySharingLinksForSession();
  return NextResponse.json({ success: true, enabled: true, links });
}

export async function POST(request: Request) {
  if (!(await isIntegrationEnabled("family_sharing"))) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("family_sharing.err_disabled"),
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  const rec =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const emailRaw = String(rec.email ?? "");
  const email = normalizeInviteEmail(emailRaw);

  if (!isValidInviteEmail(email)) {
    return NextResponse.json({ success: false, message: "Invalid email" }, { status: 400 });
  }

  const { supabase, user } = await loadAuthContext();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const selfEmail = normalizeInviteEmail(user.email ?? "");
  if (email === selfEmail) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("family_sharing.err_self"),
      },
      { status: 400 },
    );
  }

  const partnerId = await lookupUserIdByEmail(email);
  if (!partnerId) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("family_sharing.err_not_found"),
      },
      { status: 404 },
    );
  }

  const color = normalizePartnerColor(String(rec.color ?? "#f59e0b"));

  const { data, error } = await supabase
    .from("family_sharing_links")
    .insert({
      owner_user_id: user.id,
      invite_email: email,
      partner_user_id: null,
      status: "pending",
      partner_display_color: color,
      combine_in_totals: false,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    const code = String(error.code ?? "");
    if (code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: await getUiPhraseForRequest("family_sharing.err_duplicate"),
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, message: error.message ?? "Failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id: data?.id ?? null });
}

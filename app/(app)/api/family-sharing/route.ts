import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { asJsonRecord, parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";
import {
  fetchFamilySharingLinksForSession,
  isValidInviteEmail,
  lookupUserIdByEmail,
  normalizeInviteEmail,
  normalizePartnerColor,
} from "@/lib/family-sharing/family-sharing-server";
import { sendFamilySharingInviteUserEmail } from "@/lib/family-sharing/send-family-invite-email";
import { isTransactionalEmailConfigured } from "@/lib/emails/send-transactional";
import { isIntegrationEnabled } from "@/lib/integrations/integration-enabled";
import { getUiPhraseForRequest, resolveRequestUiLocales } from "@/lib/ui/server-ui-phrases";

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  try {
    const enabled = await isIntegrationEnabled("family_sharing");
    if (!enabled) {
      return NextResponse.json({
        success: true,
        enabled: false,
        viewerUserId: user.id,
        links: [],
      });
    }
    const { supabase } = auth;
    const links = await fetchFamilySharingLinksForSession({ supabase, user });
    return NextResponse.json({
      success: true,
      enabled: true,
      viewerUserId: user.id,
      links,
    });
  } catch {
    return apiJsonError(500, "Internal server error");
  }
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  if (!(await isIntegrationEnabled("family_sharing"))) {
    return apiJsonError(
      403,
      await getUiPhraseForRequest("family_sharing.err_disabled"),
    );
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const rec = asJsonRecord(parsedBody.body);
  const emailRaw = String(rec.email ?? "");
  const email = normalizeInviteEmail(emailRaw);

  if (!isValidInviteEmail(email)) {
    return apiJsonError(400, "Invalid email");
  }

  const selfEmail = normalizeInviteEmail(user.email ?? "");
  if (email === selfEmail) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("family_sharing.err_self"),
    );
  }

  const partnerId = await lookupUserIdByEmail(email);
  const isExternalInvite = !partnerId;

  /*
   * Ārējs uzaicinājums bez Resend: tāds pats kļūdas teksts kā neveiksmīgai sūtīšanai,
   * lai neatklātu, vai e-pasts ir sistēmā (account oracle).
   */
  if (isExternalInvite && !isTransactionalEmailConfigured()) {
    return apiJsonError(
      502,
      await getUiPhraseForRequest("family_sharing.err_invite_failed"),
    );
  }

  const color = normalizePartnerColor(String(rec.color ?? "#f59e0b"));

  const { data, error } = await supabase
    .from("family_sharing_links")
    .insert({
      owner_user_id: user.id,
      invite_email: email,
      partner_user_id: partnerId,
      status: "pending",
      partner_display_color: color,
      owner_combine_in_totals: false,
      partner_combine_in_totals: false,
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

  const linkId = data?.id ?? null;
  if (!linkId) {
    return NextResponse.json(
      { success: false, message: "Failed" },
      { status: 500 },
    );
  }

  if (isExternalInvite) {
    const { locale } = await resolveRequestUiLocales();
    const sendResult = await sendFamilySharingInviteUserEmail({ to: email, locale });
    if (!sendResult.ok) {
      await supabase.from("family_sharing_links").delete().eq("id", linkId);
      return NextResponse.json(
        {
          success: false,
          message: await getUiPhraseForRequest("family_sharing.err_invite_failed"),
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ success: true, id: linkId });
}

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeSignupEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.delete_user.bad_request"),
      },
      { status: 400 },
    );
  }

  const rec =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const userIdRaw = rec.userId;
  const userId =
    typeof userIdRaw === "string"
      ? userIdRaw.trim()
      : String(userIdRaw ?? "").trim();

  if (!UUID_RE.test(userId)) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.delete_user.bad_request"),
      },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  if (!sessionUser) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest(
          "api.admin.delete_user.unauthorized",
        ),
      },
      { status: 401 },
    );
  }

  if (sessionUser.id === userId) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.delete_user.self"),
      },
      { status: 400 },
    );
  }

  const { data: isAdminRpc, error: adminRpcErr } = await supabase.rpc(
    "current_user_is_admin",
  );
  if (adminRpcErr || isAdminRpc !== true) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.delete_user.forbidden"),
      },
      { status: 403 },
    );
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest(
          "api.admin.delete_user.service_unavailable",
        ),
      },
      { status: 500 },
    );
  }

  const { data: targetRow, error: targetErr } = await service
    .from("users")
    .select("id, email, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (targetErr) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.delete_user.failed"),
      },
      { status: 500 },
    );
  }

  if (!targetRow) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.delete_user.not_found"),
      },
      { status: 404 },
    );
  }

  const targetIsAdmin =
    typeof targetRow.is_admin === "number"
      ? targetRow.is_admin
      : Number.parseInt(String(targetRow.is_admin ?? 0), 10) || 0;

  if (targetIsAdmin > 0) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.delete_user.admin"),
      },
      { status: 400 },
    );
  }

  const emailNorm = normalizeSignupEmail(String(targetRow.email ?? ""));
  const { error: deleteAuthErr } = await service.auth.admin.deleteUser(userId);

  if (deleteAuthErr) {
    const msg = (deleteAuthErr.message ?? "").trim().toLowerCase();
    if (msg.includes("not found") || msg.includes("user not found")) {
      return NextResponse.json(
        {
          success: false,
          message: await getUiPhraseForRequest(
            "api.admin.delete_user.not_found",
          ),
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.delete_user.failed"),
      },
      { status: 500 },
    );
  }

  if (emailNorm.includes("@")) {
    await service
      .from("retired_signup_emails")
      .delete()
      .eq("email_normalized", emailNorm);
  }

  return NextResponse.json({ success: true });
}

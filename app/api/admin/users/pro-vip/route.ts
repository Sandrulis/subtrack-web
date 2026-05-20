import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.pro_vip.bad_request"),
      },
      { status: 400 },
    );
  }

  const rec = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const userIdRaw = rec.userId;
  const userId =
    typeof userIdRaw === "string" ? userIdRaw.trim() : String(userIdRaw ?? "").trim();
  const proVipRaw = rec.proVip;
  const proVip =
    proVipRaw === true ||
    proVipRaw === "true" ||
    proVipRaw === 1 ||
    proVipRaw === "1";

  if (!UUID_RE.test(userId)) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.pro_vip.bad_request"),
      },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.pro_vip.unauthorized"),
      },
      { status: 401 },
    );
  }

  const { data: isAdminRpc, error: adminRpcErr } = await supabase.rpc(
    "current_user_is_admin",
  );
  if (adminRpcErr || isAdminRpc !== true) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.pro_vip.forbidden"),
      },
      { status: 403 },
    );
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.pro_vip.rpc_failed"),
      },
      { status: 500 },
    );
  }

  const { error: rpcErr } = await service.rpc("admin_set_user_pro_vip", {
    target_user_id: userId,
    enabled: proVip,
  });

  if (rpcErr) {
    const msg = (rpcErr.message ?? "").trim();
    if (msg.includes("admin_set_user_pro_vip_missing_user")) {
      return NextResponse.json(
        {
          success: false,
          message: await getUiPhraseForRequest("api.admin.pro_vip.not_found"),
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: await getUiPhraseForRequest("api.admin.pro_vip.rpc_failed"),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

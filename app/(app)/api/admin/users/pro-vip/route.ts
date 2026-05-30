import { NextResponse } from "next/server";
import { asJsonRecord, parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiAdmin } from "@/lib/api/require-api-admin";
import { apiJsonError } from "@/lib/api/json-response";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";
import { isValidUuid } from "@/lib/validation/uuid";

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(
    request,
    await getUiPhraseForRequest("api.admin.pro_vip.bad_request"),
  );
  if (!parsedBody.ok) return parsedBody.response;

  const rec = asJsonRecord(parsedBody.body);
  const userIdRaw = rec.userId;
  const userId =
    typeof userIdRaw === "string" ? userIdRaw.trim() : String(userIdRaw ?? "").trim();
  const proVipRaw = rec.proVip;
  const proVip =
    proVipRaw === true ||
    proVipRaw === "true" ||
    proVipRaw === 1 ||
    proVipRaw === "1";

  if (!isValidUuid(userId)) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.admin.pro_vip.bad_request"),
    );
  }

  const admin = await requireApiAdmin({
    unauthorized: await getUiPhraseForRequest("api.admin.pro_vip.unauthorized"),
    forbidden: await getUiPhraseForRequest("api.admin.pro_vip.forbidden"),
  });
  if (!admin.ok) return admin.response;

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.admin.pro_vip.rpc_failed"),
    );
  }

  const { data: targetRow, error: targetErr } = await service
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (targetErr) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.admin.pro_vip.rpc_failed"),
    );
  }

  if (!targetRow) {
    return apiJsonError(
      404,
      await getUiPhraseForRequest("api.admin.pro_vip.not_found"),
    );
  }

  const { error: updErr } = await service
    .from("users")
    .update({ pro_vip: proVip })
    .eq("id", userId);

  if (updErr) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.admin.pro_vip.rpc_failed"),
    );
  }

  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { asJsonRecord, parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiAdmin } from "@/lib/api/require-api-admin";
import { apiJsonError } from "@/lib/api/json-response";
import { deleteUserAccountById } from "@/lib/auth/delete-user-account";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";
import { isValidUuid } from "@/lib/validation/uuid";

export async function POST(request: Request) {
  const parsedBody = await parseJsonBody(
    request,
    await getUiPhraseForRequest("api.admin.delete_user.bad_request"),
  );
  if (!parsedBody.ok) return parsedBody.response;

  const rec = asJsonRecord(parsedBody.body);
  const userIdRaw = rec.userId;
  const userId =
    typeof userIdRaw === "string"
      ? userIdRaw.trim()
      : String(userIdRaw ?? "").trim();

  if (!isValidUuid(userId)) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.admin.delete_user.bad_request"),
    );
  }

  const admin = await requireApiAdmin({
    unauthorized: await getUiPhraseForRequest("api.admin.delete_user.unauthorized"),
    forbidden: await getUiPhraseForRequest("api.admin.delete_user.forbidden"),
  });
  if (!admin.ok) return admin.response;
  const { user: sessionUser } = admin;

  if (sessionUser.id === userId) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.admin.delete_user.self"),
    );
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.admin.delete_user.service_unavailable"),
    );
  }

  const { data: targetRow, error: targetErr } = await service
    .from("users")
    .select("id, email, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (targetErr) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.admin.delete_user.failed"),
    );
  }

  if (!targetRow) {
    return apiJsonError(
      404,
      await getUiPhraseForRequest("api.admin.delete_user.not_found"),
    );
  }

  const targetIsAdmin =
    typeof targetRow.is_admin === "number"
      ? targetRow.is_admin
      : Number.parseInt(String(targetRow.is_admin ?? 0), 10) || 0;

  if (targetIsAdmin > 0) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.admin.delete_user.admin"),
    );
  }

  const result = await deleteUserAccountById(service, userId);
  if (!result.ok) {
    if (result.code === "not_found") {
      return apiJsonError(
        404,
        await getUiPhraseForRequest("api.admin.delete_user.not_found"),
      );
    }
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.admin.delete_user.failed"),
    );
  }

  return NextResponse.json({ success: true });
}

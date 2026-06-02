import { NextResponse } from "next/server";
import { asJsonRecord, parseJsonBody } from "@/lib/api/parse-json-body";
import { apiJsonError } from "@/lib/api/json-response";
import { requireApiSession } from "@/lib/api/require-api-session";
import { deleteUserAccountById } from "@/lib/auth/delete-user-account";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

const REASON_MAX = 4000;

export async function POST(request: Request) {
  const auth = await requireApiSession(
    await getUiPhraseForRequest("api.user.delete_account.unauthorized"),
  );
  if (!auth.ok) return auth.response;
  const { user } = auth;

  let deletionReason = "";
  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok) {
    const rec = asJsonRecord(parsedBody.body);
    const raw = rec.reason ?? rec.deletionReason;
    if (typeof raw === "string") {
      deletionReason = raw.trim().slice(0, REASON_MAX);
    }
  }

  const { data: row, error: rowErr } = await auth.supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (rowErr) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.user.delete_account.failed"),
    );
  }

  const isAdmin =
    typeof row?.is_admin === "number"
      ? row.is_admin
      : Number.parseInt(String(row?.is_admin ?? 0), 10) || 0;

  if (isAdmin > 0) {
    return apiJsonError(
      400,
      await getUiPhraseForRequest("api.user.delete_account.admin"),
    );
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.user.delete_account.service_unavailable"),
    );
  }

  const result = await deleteUserAccountById(service, user.id, { deletionReason });
  if (!result.ok) {
    if (result.code === "not_found") {
      return apiJsonError(
        404,
        await getUiPhraseForRequest("api.user.delete_account.not_found"),
      );
    }
    return apiJsonError(
      500,
      await getUiPhraseForRequest("api.user.delete_account.failed"),
    );
  }

  return NextResponse.json({ success: true });
}

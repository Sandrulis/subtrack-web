import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  let endpoint = "";
  const parsedBody = await parseJsonBody(request);
  if (parsedBody.ok) {
    const body = parsedBody.body as { endpoint?: unknown };
    endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  }

  if (!endpoint) {
    const { error } = await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
    if (error) {
      return apiJsonError(500, error.message);
    }
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return apiJsonError(500, error.message);
  }

  return NextResponse.json({ success: true });
}

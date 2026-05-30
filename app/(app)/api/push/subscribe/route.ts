import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireApiSession } from "@/lib/api/require-api-session";

type Body = {
  endpoint?: unknown;
  p256dh?: unknown;
  auth?: unknown;
};

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;

  const body = parsedBody.body as Body;
  const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
  const p256dh = typeof body.p256dh === "string" ? body.p256dh.trim() : "";
  const authKey = typeof body.auth === "string" ? body.auth.trim() : "";
  if (!endpoint || !p256dh || !authKey) {
    return apiJsonError(400, "Missing subscription fields");
  }

  const ua = request.headers.get("user-agent") ?? null;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth: authKey,
      user_agent: ua,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return apiJsonError(500, error.message);
  }

  return NextResponse.json({ success: true });
}

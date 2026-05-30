import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { resolveSessionIsAdmin } from "@/lib/auth/is-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type RequireApiAdminResult =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; response: NextResponse };

export async function requireApiAdmin(messages: {
  unauthorized: string;
  forbidden: string;
}): Promise<RequireApiAdminResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: apiJsonError(401, messages.unauthorized) };
  }

  const isAdmin = await resolveSessionIsAdmin(supabase);
  if (!isAdmin) {
    return { ok: false, response: apiJsonError(403, messages.forbidden) };
  }

  return { ok: true, supabase, user };
}

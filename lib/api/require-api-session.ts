import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { apiJsonError } from "@/lib/api/json-response";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ApiSession = {
  supabase: SupabaseClient;
  user: User;
};

export type RequireApiSessionResult =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; response: NextResponse };

export async function requireApiSession(
  unauthorizedMessage = "Unauthorized",
): Promise<RequireApiSessionResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: apiJsonError(401, unauthorizedMessage) };
  }

  return { ok: true, supabase, user };
}

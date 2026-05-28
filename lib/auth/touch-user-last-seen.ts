import type { SupabaseClient } from "@supabase/supabase-js";

/** Atjauno `public.users.last_seen` (RPC ar 2 min droseļu). Kļūdas neizmet ārā. */
export async function touchUserLastSeen(
  supabase: SupabaseClient,
): Promise<void> {
  try {
    const { error } = await supabase.rpc("touch_user_last_seen");
    if (error) {
      console.warn("[touch_user_last_seen]", error.message);
    }
  } catch (err) {
    console.warn("[touch_user_last_seen]", err);
  }
}

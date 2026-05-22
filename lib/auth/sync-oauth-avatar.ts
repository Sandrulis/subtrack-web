import type { SupabaseClient, User } from "@supabase/supabase-js";
import { extractOAuthAvatarUrl } from "@/lib/auth/oauth-avatar-url";

/** Saglabā OAuth profila URL `public.users.avatar_url`, ja metadata satur derīgu HTTPS saiti. */
export async function syncOAuthAvatarToPublicUser(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "user_metadata">,
): Promise<void> {
  const avatarUrl = extractOAuthAvatarUrl(
    user.user_metadata as Record<string, unknown> | undefined,
  );
  if (!avatarUrl) return;

  await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
}

/** HTTPS profila bilde no Supabase Auth `user_metadata` (Google: `avatar_url`, `picture`). */
export function extractOAuthAvatarUrl(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) return null;
  for (const key of ["avatar_url", "picture"] as const) {
    const raw = metadata[key];
    if (typeof raw !== "string") continue;
    const url = raw.trim();
    if (url.startsWith("https://")) return url;
  }
  return null;
}

export function isHttpsAvatarUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim().startsWith("https://");
}

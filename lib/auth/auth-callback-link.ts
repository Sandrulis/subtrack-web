/** Saite e-pastā: repazy.com/auth/callback (ne supabase.co/auth/v1/verify). */
export function buildAuthCallbackActionUrl(
  siteUrl: string,
  props: { action_link?: string | null; hashed_token?: string | null },
  type: "signup" | "recovery",
  nextPath: string,
): string {
  const site = siteUrl.replace(/\/$/, "");
  const next = encodeURIComponent(nextPath);
  const token = props.hashed_token?.trim();
  if (token) {
    return `${site}/auth/callback?token_hash=${encodeURIComponent(token)}&type=${type}&next=${next}`;
  }
  const fallback = props.action_link?.trim();
  if (fallback) return fallback;
  return `${site}/auth/callback?next=${next}`;
}

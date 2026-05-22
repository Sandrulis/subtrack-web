/** OAuth atgriešanās uz app (ne uz `*.supabase.co`). */
export function buildAuthOAuthRedirectTo(
  origin: string,
  nextPath = "/dashboard",
): string {
  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
  return `${origin.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

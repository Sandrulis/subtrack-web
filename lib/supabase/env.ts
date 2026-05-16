/**
 * Publiskās Supabase vides mainīgie (droši klientam / middleware).
 * Bez tām auth sesijas nedarbojas - projektu var palaist arī bez .env (tikai UI),
 * bet middleware izlaidīs Supabase apstrādi.
 */
export function getSupabasePublicConfig():
  | { url: string; anonKey: string }
  | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

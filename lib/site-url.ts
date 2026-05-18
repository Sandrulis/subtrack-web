/** Publiskā vietnes sakne bez beigu `/` (no `NEXT_PUBLIC_SITE_URL`). */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** `metadataBase` un absolūti OG/canonical URL. */
export function getPublicSiteOrigin(): URL {
  return new URL(`${getPublicSiteUrl()}/`);
}

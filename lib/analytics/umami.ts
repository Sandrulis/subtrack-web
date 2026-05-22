/** Umami Cloud – skripts un website ID (https://cloud.umami.is). */
export const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";

export function getUmamiWebsiteId(): string | null {
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  return id || null;
}

import { headers } from "next/headers";
import {
  clientIpFromHeaders,
  isPrivateOrUnknownIp,
} from "@/lib/geo/client-ip-from-headers";
import { normalizeCountryCode } from "@/lib/billing/country-to-billing-currency";

const CDN_COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
] as const;

function countryFromCdnHeaders(headerStore: Headers): string | null {
  for (const name of CDN_COUNTRY_HEADERS) {
    const raw = headerStore.get(name);
    const code = normalizeCountryCode(raw);
    if (code) return code;
  }
  return null;
}

async function countryFromIpLookup(ip: string): Promise<string | null> {
  if (isPrivateOrUnknownIp(ip)) return null;
  const encoded = encodeURIComponent(ip);
  const url = `http://ip-api.com/json/${encoded}?fields=status,countryCode`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      status?: string;
      countryCode?: string;
    };
    if (body.status !== "success") return null;
    return normalizeCountryCode(body.countryCode);
  } catch {
    return null;
  }
}

/** Valsts no CDN galvenēm; ja nav – IP ģeolokācija (ip-api.com). */
export async function resolveCountryFromHeaders(
  headerStore: Headers,
): Promise<string | null> {
  const fromCdn = countryFromCdnHeaders(headerStore);
  if (fromCdn) return fromCdn;

  const ip = clientIpFromHeaders(headerStore);
  return countryFromIpLookup(ip);
}

/** Ērtības wrapper Server Actions / RSC. */
export async function resolveRequestCountryCode(): Promise<string | null> {
  const headerStore = await headers();
  return resolveCountryFromHeaders(headerStore);
}

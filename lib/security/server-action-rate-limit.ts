import { headers } from "next/headers";
import { rateLimitAllow } from "@/lib/security/rate-limit-allow";
import {
  effectiveRateLimitMax,
  isRateLimitDisabled,
} from "@/lib/security/sliding-window-rate-limit";

function clientIpFromHeaders(headerStore: Headers): string {
  const xff = headerStore.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headerStore.get("x-real-ip")?.trim();
  if (real) return real;
  return headerStore.get("cf-connecting-ip")?.trim() ?? "unknown";
}

/**
 * Server Action / Route Handler rate limit (in-memory, kā proxy M2).
 * Atgriež true, ja pieprasījums atļauts.
 */
export async function allowServerActionRateLimit(
  scope: string,
  baseMax: number,
  windowMs: number,
): Promise<boolean> {
  if (isRateLimitDisabled()) {
    return true;
  }
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const max = effectiveRateLimitMax(baseMax);
  const key = `${scope}:${ip}`;
  return rateLimitAllow(key, windowMs, max);
}

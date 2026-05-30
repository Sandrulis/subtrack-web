import { type NextRequest, NextResponse } from "next/server";
import { rateLimitAllow } from "@/lib/security/rate-limit-allow";
import {
  effectiveRateLimitMax,
  isRateLimitDisabled,
} from "@/lib/security/sliding-window-rate-limit";

type Rule = { prefix: string; max: number; windowMs: number };

/**
 * Vienkāršs slīdošā loga ierobežojums (Edge proxy; atmiņa neatšķiras starp izolētiem deploy instancēm).
 * Produkcijā ieteicams papildināt ar CDN/Redis, ja vajag globālu skaitītāju.
 */
const RULES: Rule[] = [
  { prefix: "/signup", max: 40, windowMs: 60_000 },
  { prefix: "/login", max: 80, windowMs: 60_000 },
  { prefix: "/forgot-password", max: 40, windowMs: 60_000 },
  { prefix: "/change-password", max: 60, windowMs: 60_000 },
  { prefix: "/auth/callback", max: 120, windowMs: 60_000 },
  { prefix: "/api/subscriptions", max: 120, windowMs: 60_000 },
  { prefix: "/api/family-sharing", max: 80, windowMs: 60_000 },
  { prefix: "/api/push", max: 40, windowMs: 60_000 },
  { prefix: "/api/billing", max: 40, windowMs: 60_000 },
  { prefix: "/api/admin", max: 30, windowMs: 60_000 },
  { prefix: "/api/user", max: 60, windowMs: 60_000 },
  /** Pārējie `/api/*` (izņemot cron/webhook – nav šajā matcher ceļā ar sesiju). */
  { prefix: "/api", max: 180, windowMs: 60_000 },
];

function clientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return request.headers.get("cf-connecting-ip")?.trim() ?? "unknown";
}

/** Atgriež 429 NextResponse vai null, kad ierobežojums nepieciešams. */
export async function authRateLimitedResponse(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (isRateLimitDisabled()) {
    return null;
  }
  const path = request.nextUrl.pathname;

  const now = Date.now();
  for (const rule of RULES) {
    if (!(path === rule.prefix || path.startsWith(`${rule.prefix}/`))) {
      continue;
    }
    const max = effectiveRateLimitMax(rule.max);
    const ip = clientIp(request);
    const key = `${ip}:${rule.prefix}`;
    if (!(await rateLimitAllow(key, rule.windowMs, max, now))) {
      const sec = Math.max(1, Math.ceil(rule.windowMs / 1000));
      return NextResponse.json(
        { success: false, message: "Too many requests. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(sec),
            "Cache-Control": "no-store",
          },
        },
      );
    }
    break;
  }
  return null;
}

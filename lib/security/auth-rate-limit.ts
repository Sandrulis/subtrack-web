import { type NextRequest, NextResponse } from "next/server";

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
];

const buckets = new Map<string, number[]>();

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

function allowWindow(
  key: string,
  windowMs: number,
  max: number,
  now: number,
): boolean {
  let stamps = buckets.get(key) ?? [];
  const cut = now - windowMs;
  stamps = stamps.filter((t) => t > cut);
  if (stamps.length >= max) {
    buckets.set(key, stamps);
    return false;
  }
  stamps.push(now);
  buckets.set(key, stamps);
  return true;
}

function effectiveMax(base: number): number {
  const multRaw = process.env.RATE_LIMIT_MULTIPLIER?.trim();
  const mult = multRaw ? Number(multRaw) : 1;
  const m = Number.isFinite(mult) && mult > 0 ? mult : 1;
  const devBump = process.env.NODE_ENV === "development" ? 2 : 1;
  return Math.max(1, Math.ceil(base * m * devBump));
}

/** Atgriež 429 NextResponse vai null, kad ierobežojums nepieciešams. */
export function authRateLimitedResponse(
  request: NextRequest,
): NextResponse | null {
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    return null;
  }
  const path = request.nextUrl.pathname;

  const now = Date.now();
  for (const rule of RULES) {
    if (!(path === rule.prefix || path.startsWith(`${rule.prefix}/`))) {
      continue;
    }
    const max = effectiveMax(rule.max);
    const ip = clientIp(request);
    const key = `${ip}:${rule.prefix}`;
    if (!allowWindow(key, rule.windowMs, max, now)) {
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

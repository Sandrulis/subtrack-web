import { slidingWindowAllow } from "@/lib/security/sliding-window-rate-limit";

type UpstashLimiter = {
  limit: (identifier: string) => Promise<{ success: boolean }>;
};

const upstashLimiters = new Map<string, UpstashLimiter>();
let upstashInitFailed = false;

async function getUpstashLimiter(
  max: number,
  windowMs: number,
): Promise<UpstashLimiter | null> {
  if (upstashInitFailed) return null;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${max}:${windowSec}`;
  const cached = upstashLimiters.get(cacheKey);
  if (cached) return cached;

  try {
    const [{ Ratelimit }, { Redis }] = await Promise.all([
      import("@upstash/ratelimit"),
      import("@upstash/redis"),
    ]);
    const redis = Redis.fromEnv();
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
      prefix: "subtrack_rl",
    });
    upstashLimiters.set(cacheKey, limiter);
    return limiter;
  } catch {
    upstashInitFailed = true;
    return null;
  }
}

/**
 * Slīdošais logs: Upstash (ja `UPSTASH_REDIS_REST_*`), citādi in-memory (Edge/instance).
 */
export async function rateLimitAllow(
  key: string,
  windowMs: number,
  max: number,
  now = Date.now(),
): Promise<boolean> {
  const upstash = await getUpstashLimiter(max, windowMs);
  if (upstash) {
    try {
      const { success } = await upstash.limit(key);
      return success;
    } catch {
      /* fallback */
    }
  }
  return slidingWindowAllow(key, windowMs, max, now);
}

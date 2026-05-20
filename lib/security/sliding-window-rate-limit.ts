type Bucket = number[];

const buckets = new Map<string, Bucket>();

export function slidingWindowAllow(
  key: string,
  windowMs: number,
  max: number,
  now = Date.now(),
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

export function effectiveRateLimitMax(base: number): number {
  const multRaw = process.env.RATE_LIMIT_MULTIPLIER?.trim();
  const mult = multRaw ? Number(multRaw) : 1;
  const m = Number.isFinite(mult) && mult > 0 ? mult : 1;
  const devBump = process.env.NODE_ENV === "development" ? 2 : 1;
  return Math.max(1, Math.ceil(base * m * devBump));
}

export function isRateLimitDisabled(): boolean {
  return process.env.DISABLE_RATE_LIMIT === "true";
}

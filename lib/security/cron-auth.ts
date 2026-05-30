import { timingSafeEqual } from "node:crypto";

/**
 * Cron Route Handlers: tikai `Authorization: Bearer <CRON_SECRET>`.
 * Query `?secret=` nav atbalstīts (logu noplūde).
 */
export function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (auth.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  } catch {
    return false;
  }
}

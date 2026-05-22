/**
 * Cron Route Handlers: tikai `Authorization: Bearer <CRON_SECRET>`.
 * Query `?secret=` nav atbalstīts (logu noplūde).
 */
export function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

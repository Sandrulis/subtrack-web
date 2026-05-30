/**
 * Sentry notikumi tikai produkcijas runtime (Vercel repazy.com).
 * Lokāli `npm run dev` – izslēgts, lai neēstu free kvotu.
 * Piespiedu lokāls tests: .env.local `SENTRY_ENABLED=1`
 */
export function isSentryEnabled(): boolean {
  const override = process.env.SENTRY_ENABLED?.trim().toLowerCase();
  if (override === "1" || override === "true" || override === "yes") {
    return true;
  }
  if (override === "0" || override === "false" || override === "no") {
    return false;
  }
  return process.env.NODE_ENV === "production";
}

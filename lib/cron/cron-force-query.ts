/** Admin / testa palaišana ar `?force=1` (tikai kopā ar `Authorization: Bearer CRON_SECRET`). */
export function isCronForceRun(request: Request): boolean {
  try {
    return new URL(request.url).searchParams.get("force") === "1";
  } catch {
    return false;
  }
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return out;
}

export function formatDateTimeIntl(iso: string, intlLocale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  }
}

const LAST_SEEN_MAX_RELATIVE_DAYS = 30;

/**
 * Admin lietotāju saraksts: šodien – minūtes/sekundes pirms; 1–30 d. – dienas nav redzēts;
 * vecāk – absolūts datums/laiks.
 */
export function formatUserLastSeenDisplay(
  lastSeenIso: string | null,
  t: (key: string) => string,
  intlLocale: string,
): string {
  if (!lastSeenIso?.trim()) return "–";

  const seen = new Date(lastSeenIso);
  if (Number.isNaN(seen.getTime())) return "–";

  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const seenDayStart = startOfLocalDay(seen);

  if (seenDayStart.getTime() === todayStart.getTime()) {
    const diffSec = Math.max(0, Math.floor((now.getTime() - seen.getTime()) / 1000));
    const minutes = Math.floor(diffSec / 60);
    const seconds = diffSec % 60;
    return interpolate(t("admin.users.last_seen_ago_today"), { minutes, seconds });
  }

  const days = Math.floor(
    (todayStart.getTime() - seenDayStart.getTime()) / 86_400_000,
  );

  if (days >= 1 && days <= LAST_SEEN_MAX_RELATIVE_DAYS) {
    if (days === 1) return t("admin.users.last_seen_one_day");
    return interpolate(t("admin.users.last_seen_days"), { days });
  }

  return formatDateTimeIntl(lastSeenIso, intlLocale);
}

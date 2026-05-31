import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";

export type LauncherBadgeSummary = {
  overdue: number;
  dueToday: number;
  upcoming: number;
  familyInvites: number;
};

export type LauncherBadgeNotificationCopy = {
  title: string;
  body: string;
};

function formatLine(
  locale: string,
  key: string,
  count: number,
  fallback: string,
): string {
  if (count <= 0) return "";
  const raw = pickFallbackPhrase(key, locale) ?? fallback;
  return raw.replace(/\{count\}/g, String(count));
}

function resolveFsLocale(): string {
  if (typeof window === "undefined") return "lv";
  const meta = (
    window as Window & { __SUBTRACK_FS_META?: { intlLocale?: string } }
  ).__SUBTRACK_FS_META;
  const bcp = meta?.intlLocale?.trim().toLowerCase() ?? "";
  if (!bcp) return "lv";
  return bcp.split("-")[0] || "lv";
}

/** Teksts Android paziņojuma joslai (ja nav padots no `dash-alerts.js`). */
export function buildLauncherBadgeNotificationCopy(
  summary: LauncherBadgeSummary,
  localeCode?: string,
): LauncherBadgeNotificationCopy {
  const locale = localeCode?.trim().toLowerCase() || resolveFsLocale();
  const title =
    pickFallbackPhrase("session.notify_title", locale) ?? "Paziņojumi";

  const parts = [
    formatLine(
      locale,
      "native.launcher_notify.line_overdue",
      summary.overdue,
      "Kavētie: {count}",
    ),
    formatLine(
      locale,
      "native.launcher_notify.line_today",
      summary.dueToday,
      "Šodien jāmaksā: {count}",
    ),
    formatLine(
      locale,
      "native.launcher_notify.line_upcoming",
      summary.upcoming,
      "Gaidāmie (7 d.): {count}",
    ),
    formatLine(
      locale,
      "native.launcher_notify.line_family",
      summary.familyInvites,
      "Uzaicinājumi: {count}",
    ),
  ].filter(Boolean);

  const body =
    parts.length > 0
      ? parts.join(" · ")
      : String(
          summary.overdue +
            summary.dueToday +
            summary.upcoming +
            summary.familyInvites,
        );

  return { title, body };
}

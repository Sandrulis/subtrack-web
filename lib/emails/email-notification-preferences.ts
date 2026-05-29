export type EmailNotificationPreferences = {
  dueToday: boolean;
  weekly: boolean;
  trialEnd: boolean;
  winBack: boolean;
};

export const EMAIL_NOTIFICATION_DEFAULTS: EmailNotificationPreferences = {
  dueToday: true,
  weekly: true,
  trialEnd: true,
  winBack: true,
};

function pickBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  return fallback;
}

export function readEmailNotificationPreferences(
  raw: unknown,
): EmailNotificationPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMAIL_NOTIFICATION_DEFAULTS };
  }
  const o = raw as Record<string, unknown>;
  return {
    dueToday: pickBool(o.due_today, EMAIL_NOTIFICATION_DEFAULTS.dueToday),
    weekly: pickBool(o.weekly, EMAIL_NOTIFICATION_DEFAULTS.weekly),
    trialEnd: pickBool(o.trial_end, EMAIL_NOTIFICATION_DEFAULTS.trialEnd),
    winBack: pickBool(o.win_back, EMAIL_NOTIFICATION_DEFAULTS.winBack),
  };
}

export function toEmailNotificationPreferencesJson(
  prefs: EmailNotificationPreferences,
): Record<string, boolean> {
  return {
    due_today: prefs.dueToday,
    weekly: prefs.weekly,
    trial_end: prefs.trialEnd,
    win_back: prefs.winBack,
  };
}

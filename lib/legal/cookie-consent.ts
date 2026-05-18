export const COOKIE_CONSENT_COOKIE = "subtrack_cookie_consent_v1";
export const COOKIE_CONSENT_VERSION = 1 as const;

export type CookieConsentPreferences = {
  v: typeof COOKIE_CONSENT_VERSION;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  ts: number;
};

export type CookieConsentChoice = Pick<
  CookieConsentPreferences,
  "functional" | "analytics"
>;

const MAX_AGE_SEC = 60 * 60 * 24 * 365;

function parseConsent(raw: string | undefined | null): CookieConsentPreferences | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(decodeURIComponent(raw)) as Partial<CookieConsentPreferences>;
    if (o.v !== COOKIE_CONSENT_VERSION) return null;
    if (o.necessary !== true) return null;
    if (typeof o.functional !== "boolean" || typeof o.analytics !== "boolean") {
      return null;
    }
    if (typeof o.ts !== "number" || !Number.isFinite(o.ts)) return null;
    return {
      v: COOKIE_CONSENT_VERSION,
      necessary: true,
      functional: o.functional,
      analytics: o.analytics,
      ts: o.ts,
    };
  } catch {
    return null;
  }
}

export function readCookieConsentFromDocument(): CookieConsentPreferences | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_CONSENT_COOKIE}=`));
  if (!match) return null;
  const raw = match.slice(COOKIE_CONSENT_COOKIE.length + 1);
  return parseConsent(raw);
}

export function hasCookieConsentChoice(): boolean {
  return readCookieConsentFromDocument() !== null;
}

export function canSetFunctionalCookies(): boolean {
  const c = readCookieConsentFromDocument();
  if (!c) return true;
  return c.functional;
}

export function writeCookieConsent(choice: CookieConsentChoice): CookieConsentPreferences {
  const payload: CookieConsentPreferences = {
    v: COOKIE_CONSENT_VERSION,
    necessary: true,
    functional: choice.functional,
    analytics: choice.analytics,
    ts: Date.now(),
  };
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(payload))};path=/;max-age=${MAX_AGE_SEC};samesite=lax`;
  }
  return payload;
}

export const OPEN_COOKIE_SETTINGS_EVENT = "subtrack:open-cookie-settings";

export function dispatchOpenCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
}

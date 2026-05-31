import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
import { writeCookieConsent } from "@/lib/legal/cookie-consent";

/** Native app – bez GDPR bannera; funkcionālās sīkdatnes ieslēgtas (UI valoda u.c.). */
export function ensureNativeCookieConsent(): void {
  if (!isNativeCapacitorApp()) return;
  writeCookieConsent({ functional: true, analytics: false });
}

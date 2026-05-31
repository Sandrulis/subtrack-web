import { Capacitor } from "@capacitor/core";

/** Capacitor Android/iOS aplikācija (ne pārlūks). */
export function isNativeCapacitorApp(): boolean {
  return Capacitor.isNativePlatform();
}

import { hasNativeShellSession, urlHasNativeShellFlag } from "@/lib/capacitor/native-shell-storage";
import { Capacitor } from "@capacitor/core";

/** Capacitor Android/iOS aplikācija (ne pārlūks). */
export function isNativeCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const injected = (
      window as Window & {
        Capacitor?: { isNativePlatform?: () => boolean };
      }
    ).Capacitor;
    if (injected?.isNativePlatform?.()) return true;
  } catch {
    /* ignore */
  }
  if (Capacitor.isNativePlatform()) return true;
  if (urlHasNativeShellFlag() || hasNativeShellSession()) return true;
  return false;
}

import {
  markNativeShellSession,
  NATIVE_SHELL_SW_CLEARED_KEY,
  urlHasNativeShellFlag,
} from "@/lib/capacitor/native-shell-storage";
import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";
const PWA_CACHE_PREFIXES = ["subtrack-", "repazy-", "serwist-"];

async function unregisterServiceWorkers(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const regs = await navigator.serviceWorker.getRegistrations();
  if (regs.length === 0) return false;
  await Promise.all(regs.map((r) => r.unregister()));
  return true;
}

async function clearPwaCaches(): Promise<void> {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter(
        (k) =>
          PWA_CACHE_PREFIXES.some((p) => k.startsWith(p)) || k.includes("pages"),
      )
      .map((k) => caches.delete(k)),
  );
}

/**
 * Capacitor ar `server.url` + PWA SW bieži bloķē tilta injekciju – plugini (Badge) nestrādā.
 * Native čaulā: atslēdz SW, notīra kešu, vienu reizi pārlādē lapu.
 */
export async function prepareNativeWebShell(): Promise<"reload" | "ready"> {
  const native =
    isNativeCapacitorApp() || urlHasNativeShellFlag();
  if (!native) return "ready";

  markNativeShellSession();

  const hadSw = await unregisterServiceWorkers();
  await clearPwaCaches();

  let reloaded = false;
  try {
    reloaded = sessionStorage.getItem(NATIVE_SHELL_SW_CLEARED_KEY) === "1";
  } catch {
    /* ignore */
  }

  if (hadSw && !reloaded) {
    try {
      sessionStorage.setItem(NATIVE_SHELL_SW_CLEARED_KEY, "1");
    } catch {
      /* ignore */
    }
    window.location.reload();
    return "reload";
  }

  window.dispatchEvent(new CustomEvent("subtrack:native-shell-ready"));
  return "ready";
}

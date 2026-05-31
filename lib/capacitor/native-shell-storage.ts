export const NATIVE_SHELL_SESSION_KEY = "subtrack_native_shell";
export const NATIVE_SHELL_SW_CLEARED_KEY = "subtrack_native_sw_cleared";

export function markNativeShellSession(): void {
  try {
    sessionStorage.setItem(NATIVE_SHELL_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasNativeShellSession(): boolean {
  try {
    return sessionStorage.getItem(NATIVE_SHELL_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function urlHasNativeShellFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("native_shell") === "1";
  } catch {
    return false;
  }
}

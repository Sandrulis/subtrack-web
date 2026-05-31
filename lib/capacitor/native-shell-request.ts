/** Middleware: `native_shell=1` query → layout SSR boot overlay. */
export const NATIVE_SHELL_REQUEST_HEADER = "x-native-shell";

export function isNativeShellRequestHeader(value: string | null): boolean {
  return value === "1";
}

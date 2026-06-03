import { buildNativeShellPaintGuardScript } from "@/lib/capacitor/native-shell-paint-inject";

/**
 * Pirms React: tumšs fons + boot overlay (native WebView / ?native_shell=1).
 * Parasts <script> SSR head – ne next/Script, lai React 19 nebrīdinātu par <script> klientā.
 */
export function NativeShellPaintGuard() {
  return (
    <script
      id="subtrack-native-shell-paint"
      dangerouslySetInnerHTML={{ __html: buildNativeShellPaintGuardScript() }}
    />
  );
}

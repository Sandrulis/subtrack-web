import { NATIVE_SHELL_BACKGROUND } from "@/lib/capacitor/native-shell-brand";

/** Inline CSS head – darbojas pirms globals.css (WebView pirmais kadrs). */
export function NativeShellCriticalStyles() {
  const bg = NATIVE_SHELL_BACKGROUND;
  return (
    <style
      id="subtrack-native-shell-critical"
      dangerouslySetInnerHTML={{
        __html: `
html.native-shell-pending,html.native-shell-pending body{background-color:${bg}!important}
html.native-shell-pending .native-shell-app-root{visibility:hidden!important;pointer-events:none}
html.native-shell-pending #subtrack-native-boot{display:flex!important;position:fixed;inset:0;z-index:100000;align-items:center;justify-content:center;background:${bg};padding:1.5rem}
#subtrack-native-boot[hidden]{display:none!important}
`.trim(),
      }}
    />
  );
}

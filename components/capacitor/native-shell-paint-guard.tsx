import Script from "next/script";
import { NATIVE_SHELL_BACKGROUND } from "@/lib/capacitor/native-shell-brand";

/** Pirms React – tumšs WebView fons, lai starp splash un overlay nebūtu balta zibsnīšana. */
export function NativeShellPaintGuard() {
  const bg = NATIVE_SHELL_BACKGROUND;
  return (
    <Script id="subtrack-native-shell-paint" strategy="beforeInteractive">
      {`(function(){try{var u=location.search.indexOf("native_shell=1")>=0,s=sessionStorage.getItem("subtrack_native_shell")==="1",c=window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform();if(!u&&!s&&!c)return;document.documentElement.classList.add("native-shell");document.documentElement.style.backgroundColor="${bg}";var b=document.body;if(b)b.style.backgroundColor="${bg}";}catch(e){}})();`}
    </Script>
  );
}

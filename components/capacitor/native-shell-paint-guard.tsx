import Script from "next/script";
import {
  NATIVE_SHELL_BACKGROUND,
  NATIVE_SHELL_LOGO_PATH,
} from "@/lib/capacitor/native-shell-brand";

/** Pirms React / pirms pilna body: tumšs fons + boot overlay (bez gaidīšanas DOMContentLoaded). */
export function NativeShellPaintGuard() {
  const bg = NATIVE_SHELL_BACKGROUND;
  const logo = NATIVE_SHELL_LOGO_PATH;
  return (
    <Script id="subtrack-native-shell-paint" strategy="beforeInteractive">
      {`(function(){try{var u=location.search.indexOf("native_shell=1")>=0,s=sessionStorage.getItem("subtrack_native_shell")==="1",c=window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform();if(!u&&!s&&!c)return;var r=document.documentElement;r.classList.add("native-shell-pending");r.style.backgroundColor="${bg}";function showBoot(){var b=document.body;if(b)b.style.backgroundColor="${bg}";var boot=document.getElementById("subtrack-native-boot");if(!boot)return;boot.hidden=false;boot.style.display="flex";var img=boot.querySelector("img");if(img&&!img.getAttribute("src"))img.setAttribute("src","${logo}");}showBoot();if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",showBoot,{once:true});}var obs=new MutationObserver(showBoot);if(document.body){obs.observe(document.body,{childList:true,subtree:false});}else{document.addEventListener("DOMContentLoaded",function(){obs.observe(document.body,{childList:true,subtree:false});},{once:true});}setTimeout(function(){obs.disconnect();},3000);}catch(e){}})();`}
    </Script>
  );
}

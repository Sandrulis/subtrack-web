import { FONT_AWESOME_CDN_STYLESHEET } from "@/lib/icons/font-awesome-cdn";

/** Inline IIFE for `next/script` – nebloķējoša FA CSS ielāde pēc interaktivitātes. */
export const FONT_AWESOME_DEFERRED_INJECT = `(function(){var h=${JSON.stringify(
  FONT_AWESOME_CDN_STYLESHEET,
)};if(document.querySelector('link[data-subtrack-fa]'))return;var l=document.createElement("link");l.rel="stylesheet";l.href=h;l.crossOrigin="anonymous";l.setAttribute("data-subtrack-fa","1");document.head.appendChild(l);})();`;

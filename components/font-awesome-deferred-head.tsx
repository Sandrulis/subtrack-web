import {
  FONT_AWESOME_CDN_ORIGIN,
  FONT_AWESOME_CDN_STYLESHEET,
} from "@/lib/icons/font-awesome-cdn";

/**
 * Nebloķējoša FA ielāde: pirmais paint (hero teksts, LCP) nav atkarīgs no ~70KB CDN CSS.
 * Ikonas parādās īsi pēc tam; bez JS – noscript sinhronais fallback.
 */
export function FontAwesomeDeferredHead() {
  const href = FONT_AWESOME_CDN_STYLESHEET;
  const inject = `(function(){var h=${JSON.stringify(href)};if(document.querySelector('link[data-subtrack-fa]'))return;var l=document.createElement("link");l.rel="stylesheet";l.href=h;l.crossOrigin="anonymous";l.setAttribute("data-subtrack-fa","1");document.head.appendChild(l);})();`;

  return (
    <>
      <link rel="preconnect" href={FONT_AWESOME_CDN_ORIGIN} crossOrigin="anonymous" />
      <link rel="preload" href={href} as="style" crossOrigin="anonymous" />
      <noscript>
        <link
          rel="stylesheet"
          href={href}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </noscript>
      <script dangerouslySetInnerHTML={{ __html: inject }} />
    </>
  );
}

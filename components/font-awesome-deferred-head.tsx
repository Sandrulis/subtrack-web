import {
  FONT_AWESOME_CDN_ORIGIN,
  FONT_AWESOME_CDN_STYLESHEET,
} from "@/lib/icons/font-awesome-cdn";

/**
 * Nebloķējoša FA ielāde: pirmais paint nav atkarīgs no ~70KB CDN CSS.
 * Skripts – `next/script` root layout (`afterInteractive`); šeit tikai resursu hinti.
 */
export function FontAwesomeDeferredHead() {
  const href = FONT_AWESOME_CDN_STYLESHEET;

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
    </>
  );
}

import {
  FONT_AWESOME_CDN_ORIGIN,
  FONT_AWESOME_CDN_STYLESHEET,
} from "@/lib/icons/font-awesome-cdn";

/**
 * Font Awesome 6 no CDN. Parasts `<link rel="stylesheet">` – aizturi ar skriptu
 * salauza ikonas (skat. README 0.4.22); sinhrona ielāde ir uzticamāka.
 */
export function FontAwesomeDeferredHead() {
  const href = FONT_AWESOME_CDN_STYLESHEET;

  return (
    <>
      <link rel="preconnect" href={FONT_AWESOME_CDN_ORIGIN} crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href={href}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </>
  );
}

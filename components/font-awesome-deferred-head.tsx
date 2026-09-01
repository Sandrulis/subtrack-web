import { FONT_AWESOME_STYLESHEET } from "@/lib/icons/font-awesome-cdn";

/** Font Awesome 6 – lokāls CSS no `public/vendor/font-awesome` (nav atkarīgs no CDN). */
export function FontAwesomeDeferredHead() {
  return (
    <link
      rel="stylesheet"
      href={FONT_AWESOME_STYLESHEET}
    />
  );
}

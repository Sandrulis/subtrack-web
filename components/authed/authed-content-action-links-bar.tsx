"use client";

import { AuthedFooterActionLinks } from "@/components/authed/authed-footer-action-links";
import { AuthedNavOverlaysProvider } from "@/components/authed/authed-nav-overlays-provider";

/** Ieteikumi · Atsauksmes · Palīdzība — augšā satura zonā (ne footer, ne fixed). */
export function AuthedContentActionLinksBar() {
  return (
    <div className="authed-content-action-links-bar">
      <AuthedNavOverlaysProvider>
        <AuthedFooterActionLinks />
      </AuthedNavOverlaysProvider>
    </div>
  );
}

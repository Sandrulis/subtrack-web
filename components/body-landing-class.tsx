"use client";

import { useLayoutEffect, type ReactNode } from "react";

const LANDING_BODY_CLASS = "landing-page";

/**
 * Sākumlapas body klase fona stiliem. Horizontālais ritms ir CSS (negaida šo klasi).
 * Inline skripts + useLayoutEffect – lai fons un max-width būtu uzreiz, pirms/atverot hydration.
 */
export function BodyLandingPageClass({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    document.body.classList.add(LANDING_BODY_CLASS);
    return () => {
      document.body.classList.remove(LANDING_BODY_CLASS);
    };
  }, []);

  return <>{children}</>;
}

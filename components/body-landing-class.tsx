"use client";

import { useEffect, type ReactNode } from "react";

export function BodyLandingPageClass({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add("landing-page");
    return () => {
      document.body.classList.remove("landing-page");
    };
  }, []);

  return <>{children}</>;
}

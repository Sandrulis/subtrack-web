"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type SiteBrandLogoProps = {
  size?: number;
  className?: string;
};

/** Augšupielādēts logo; bez logo atgriež `null` (rādi nosaukumu blakus komponentē). */
export function SiteBrandLogo({ size = 36, className }: SiteBrandLogoProps) {
  const { brandLogo } = useSubtrackIntl();
  const src = brandLogo?.topbar;
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage publisks URL
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className ?? "site-brand-logo"}
      decoding="async"
      aria-hidden="true"
    />
  );
}

/** Pieejamības nosaukums logo saitei (topbar). */
export function useBrandLinkLabel(): string {
  const { systemSiteName } = useSubtrackIntl();
  return systemSiteName;
}

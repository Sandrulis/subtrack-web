"use client";

import Link from "next/link";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { SiteBrandLogo, useBrandLinkLabel } from "@/components/brand/site-brand-logo";

type DashBrandLinkProps = {
  href: string;
  className?: string;
};

export function DashBrandLink({ href, className }: DashBrandLinkProps) {
  const label = useBrandLinkLabel();
  const { brandLogo } = useSubtrackIntl();
  const hasLogo = Boolean(brandLogo?.topbar);

  return (
    <Link
      href={href}
      className={className ?? "dash-brand"}
      aria-label={label}
      title={label}
    >
      {hasLogo ? (
        <SiteBrandLogo size={36} className="dash-brand-logo" />
      ) : (
        <span className="dash-brand-text">{label}</span>
      )}
    </Link>
  );
}

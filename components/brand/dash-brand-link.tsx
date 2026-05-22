"use client";

import Link from "next/link";
import { useNavBrand } from "@/components/brand/nav-brand-bridge";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

type DashBrandLinkProps = {
  href: string;
  className?: string;
};

export function DashBrandLink({ href, className }: DashBrandLinkProps) {
  const navBrand = useNavBrand();
  const { systemSiteName, brandLogo } = useSubtrackIntl();
  const label = navBrand?.label ?? systemSiteName;
  const logoTopbar = navBrand?.logoTopbar ?? brandLogo?.topbar ?? null;
  const hasLogo = Boolean(logoTopbar);

  return (
    <Link
      href={href}
      className={className ?? "dash-brand"}
      aria-label={label}
      title={label}
    >
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage publisks URL
        <img
          src={logoTopbar!}
          alt=""
          width={36}
          height={36}
          className="dash-brand-logo"
          decoding="async"
          aria-hidden="true"
        />
      ) : (
        <span className="dash-brand-text">{label}</span>
      )}
    </Link>
  );
}

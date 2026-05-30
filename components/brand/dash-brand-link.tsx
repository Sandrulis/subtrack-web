"use client";

import Link from "next/link";
import { useNavBrand } from "@/components/brand/nav-brand-bridge";
import type { NavBrandSnapshot } from "@/lib/brand/nav-brand-snapshot";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";

type DashBrandLinkProps = {
  href: string;
  className?: string;
  /**
   * SSR snapshot no lapas (vienāds servera HTML un hydrācijai).
   * Ja nav, izmanto `NavBrandBridge` no layout.
   */
  brand?: NavBrandSnapshot | null;
};

export function DashBrandLink({ href, className, brand: brandProp }: DashBrandLinkProps) {
  const navBrand = useNavBrand();
  const snapshot = brandProp ?? navBrand ?? {
    label: DEFAULT_SYSTEM_NAME,
    logoTopbar: null,
  };
  const label = snapshot.label.trim() || DEFAULT_SYSTEM_NAME;
  const logoTopbar = snapshot.logoTopbar?.trim() ? snapshot.logoTopbar.trim() : null;
  const hasLogo = Boolean(logoTopbar);

  return (
    <Link
      href={href}
      className={className ?? "dash-brand"}
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- brand URL no /brand/*
        <img
          src={logoTopbar!}
          alt=""
          width={36}
          height={36}
          className="dash-brand-logo"
          decoding="async"
          aria-hidden="true"
          suppressHydrationWarning
        />
      ) : (
        <span className="dash-brand-text" suppressHydrationWarning>
          {label}
        </span>
      )}
    </Link>
  );
}

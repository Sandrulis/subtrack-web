"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type MobileBottomNavItemProps = {
  href: string;
  label: string;
  active?: boolean;
  icon: ReactNode;
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "className">;

export function MobileBottomNavItem({
  href,
  label,
  active = false,
  icon,
  className = "",
  ...linkProps
}: MobileBottomNavItemProps) {
  return (
    <Link
      href={href}
      className={
        "mobile-bottom-nav-link" +
        (active ? " is-route-active" : "") +
        (className ? ` ${className}` : "")
      }
      aria-current={active ? "page" : undefined}
      {...linkProps}
    >
      <span className="mobile-bottom-nav-item">
        <span className="mobile-bottom-nav-icon-slot" aria-hidden="true">
          {icon}
        </span>
        <span className="mobile-bottom-nav-label">{label}</span>
      </span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { NavDash } from "@/components/nav-dash";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { NavUserDisplay } from "@/lib/auth/user-display";

export type AdminNavActive =
  | "users"
  | "system"
  | "languages"
  | "translations"
  | "";

function navActiveFromPath(pathname: string): AdminNavActive {
  if (
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname.startsWith("/admin/users")
  ) {
    return "users";
  }
  if (pathname.startsWith("/admin/system")) return "system";
  if (pathname.startsWith("/admin/languages")) return "languages";
  if (pathname.startsWith("/admin/translations")) return "translations";
  return "";
}

type AdminShellProps = {
  children: React.ReactNode;
  userDisplay?: NavUserDisplay | null;
};

const navItems: {
  href: string;
  key: AdminNavActive;
  labelKey:
    | "admin.nav.users"
    | "admin.nav.languages"
    | "admin.nav.translations"
    | "admin.nav.system";
}[] = [
  { href: "/admin/users", key: "users", labelKey: "admin.nav.users" },
  {
    href: "/admin/languages",
    key: "languages",
    labelKey: "admin.nav.languages",
  },
  {
    href: "/admin/translations",
    key: "translations",
    labelKey: "admin.nav.translations",
  },
  { href: "/admin/system", key: "system", labelKey: "admin.nav.system" },
];

export function AdminShell({
  children,
  userDisplay,
}: AdminShellProps) {
  const { t, systemSiteName } = useSubtrackIntl();
  const pathname = usePathname() ?? "";
  const navActive = useMemo(
    () => navActiveFromPath(pathname),
    [pathname],
  );
  const navScrollRef = useRef<HTMLDivElement | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    const root = navScrollRef.current;
    if (!root) return;
    const active = root.querySelector<HTMLElement>(".admin-side-link.is-active");
    active?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [pathname, navActive]);

  return (
    <div className="app-layout app-layout-stacked admin-app">
      <NavDash active="admin" userDisplay={userDisplay} />
      <div className="admin-body">
        <aside className="admin-sidebar" aria-label={t("admin.sidebar.menu")}>
          <div className="admin-sidebar-head">
            <p className="admin-sidebar-title">{t("admin.sidebar.title")}</p>
            <p className="admin-sidebar-scroll-hint" aria-hidden="true">
              {t("admin.sidebar.scroll_hint")}
            </p>
          </div>
          <div className="admin-side-nav-scroll" ref={navScrollRef}>
            <nav className="admin-side-nav" aria-label={t("admin.sidebar.sections_nav")}>
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    "admin-side-link" +
                    (navActive === item.key ? " is-active" : "")
                  }
                  aria-current={navActive === item.key ? "page" : undefined}
                >
                  <span className="admin-side-link-text-full">{t(item.labelKey)}</span>
                  <span className="admin-side-link-text-short">
                    {t(item.labelKey)}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <div className="admin-main">{children}</div>
      </div>
      <footer className="landing-footer admin-footer">
        <p>
          &copy; {year} {systemSiteName}. {t("admin.footer.rights_reserved")}
        </p>
      </footer>

      <div className="toast-container" id="toast-container" />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { LegalFooterLinks } from "@/components/legal/legal-footer-links";
import { NavDash } from "@/components/nav-dash";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import type { NavBrandSnapshot } from "@/lib/brand/nav-brand-snapshot";
import type { NavUserDisplay } from "@/lib/auth/user-display";

export type AdminNavActive =
  | "users"
  | "integrations"
  | "categories"
  | "system"
  | "languages"
  | "translations"
  | "email_design"
  | "cron_jobs"
  | "pwa"
  | "todos"
  | "blog"
  | "user_messages"
  | "";

function navActiveFromPath(pathname: string): AdminNavActive {
  if (
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname.startsWith("/admin/users")
  ) {
    return "users";
  }
  if (pathname.startsWith("/admin/integrations")) return "integrations";
  if (pathname.startsWith("/admin/categories")) return "categories";
  if (pathname.startsWith("/admin/system")) return "system";
  if (pathname.startsWith("/admin/languages")) return "languages";
  if (pathname.startsWith("/admin/translations")) return "translations";
  if (pathname.startsWith("/admin/email-design")) return "email_design";
  if (pathname.startsWith("/admin/cron-jobs")) return "cron_jobs";
  if (pathname.startsWith("/admin/pwa")) return "pwa";
  if (pathname.startsWith("/admin/todos")) return "todos";
  if (pathname.startsWith("/admin/blog")) return "blog";
  if (pathname.startsWith("/admin/user-messages")) return "user_messages";
  return "";
}

type AdminShellProps = {
  children: React.ReactNode;
  userDisplay?: NavUserDisplay | null;
  brand?: NavBrandSnapshot | null;
};

const navItems: {
  href: string;
  key: AdminNavActive;
  labelKey:
    | "admin.nav.users"
    | "admin.nav.languages"
    | "admin.nav.translations"
    | "admin.nav.integrations"
    | "admin.nav.categories"
    | "admin.nav.system"
    | "admin.nav.email_design"
    | "admin.nav.cron_jobs"
    | "admin.nav.pwa"
    | "admin.nav.todos"
    | "admin.nav.blog"
    | "admin.nav.user_messages";
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
  {
    href: "/admin/integrations",
    key: "integrations",
    labelKey: "admin.nav.integrations",
  },
  {
    href: "/admin/categories",
    key: "categories",
    labelKey: "admin.nav.categories",
  },
  { href: "/admin/system", key: "system", labelKey: "admin.nav.system" },
  { href: "/admin/pwa", key: "pwa", labelKey: "admin.nav.pwa" },
  {
    href: "/admin/email-design",
    key: "email_design",
    labelKey: "admin.nav.email_design",
  },
  {
    href: "/admin/cron-jobs",
    key: "cron_jobs",
    labelKey: "admin.nav.cron_jobs",
  },
  { href: "/admin/todos", key: "todos", labelKey: "admin.nav.todos" },
  { href: "/admin/blog", key: "blog", labelKey: "admin.nav.blog" },
  {
    href: "/admin/user-messages",
    key: "user_messages",
    labelKey: "admin.nav.user_messages",
  },
];

export function AdminShell({
  children,
  userDisplay,
  brand = null,
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
      <NavDash active="admin" userDisplay={userDisplay} brand={brand} />
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
                  prefetch={false}
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
      <footer className="landing-footer landing-footer--with-legal admin-footer">
        <LegalFooterLinks />
        <p>
          &copy; {year} {systemSiteName}. {t("admin.footer.rights_reserved")}
        </p>
      </footer>

      <div className="toast-container" id="toast-container" />
    </div>
  );
}

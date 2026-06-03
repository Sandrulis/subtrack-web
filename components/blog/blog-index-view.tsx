"use client";

import Link from "next/link";
import { NavDash } from "@/components/nav-dash";
import { NavLanding } from "@/components/nav-landing";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import type { BlogPostListItem } from "@/lib/blog/blog-types";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";
import { brandHomeHref } from "@/lib/capacitor/brand-home-href";
import { useNativeCapacitorApp } from "@/lib/capacitor/use-native-capacitor-app";

export function BlogIndexView({
  posts,
  userDisplay = null,
}: {
  posts: BlogPostListItem[];
  userDisplay?: NavUserDisplay | null;
}) {
  const { t, locale } = useSubtrackIntl();
  const isNativeApp = useNativeCapacitorApp();
  const authed = Boolean(userDisplay);
  const homeHref = brandHomeHref({ authed, isNative: isNativeApp });
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);

  function formatDate(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(intlLocale, { dateStyle: "long" }).format(d);
  }

  return (
    <div className="auth-page legal-page blog-page">
      {authed ? (
        <NavDash active="" userDisplay={userDisplay} />
      ) : (
        <NavLanding active="" />
      )}
      <main id="main" className="auth-page-inner legal-page-inner blog-page-inner">
        <article className="auth-card auth-card--legal blog-index-card">
          <p className="legal-document-back">
            <Link href={homeHref}>
              {authed
                ? t("auth.change_password.back_dashboard")
                : t("legal.back_home")}
            </Link>
          </p>
          <h1>{t("blog.index.title")}</h1>
          <p className="blog-index-lead">{t("blog.index.lead")}</p>
          {posts.length === 0 ? (
            <p className="blog-empty">{t("blog.index.empty")}</p>
          ) : (
            <ul className="blog-index-list">
              {posts.map((post) => (
                <li key={post.id} className="blog-index-item">
                  <h2 className="blog-index-item-title">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  {post.published_at ? (
                    <time className="blog-index-item-date" dateTime={post.published_at}>
                      {formatDate(post.published_at)}
                    </time>
                  ) : null}
                  {post.excerpt ? (
                    <p className="blog-index-item-excerpt">{post.excerpt}</p>
                  ) : null}
                  <p className="blog-index-item-more">
                    <Link href={`/blog/${post.slug}`}>{t("blog.read_more")}</Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </main>
      <SiteLandingFooter />
    </div>
  );
}

"use client";

import Link from "next/link";
import { BlogBbcodeContent } from "@/components/blog/blog-bbcode-content";
import { NavDash } from "@/components/nav-dash";
import { NavLanding } from "@/components/nav-landing";
import { SiteLandingFooter } from "@/components/legal/site-landing-footer";
import type { BlogPostRow } from "@/lib/blog/blog-types";
import type { NavUserDisplay } from "@/lib/auth/user-display";
import { useSubtrackIntl } from "@/components/subtrack-intl-provider";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";

export function BlogPostView({
  post,
  userDisplay = null,
}: {
  post: BlogPostRow;
  userDisplay?: NavUserDisplay | null;
}) {
  const { t, locale } = useSubtrackIntl();
  const authed = Boolean(userDisplay);
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);

  const publishedLabel = (() => {
    if (!post.published_at) return "";
    const d = new Date(post.published_at);
    if (Number.isNaN(d.getTime())) return post.published_at;
    return new Intl.DateTimeFormat(intlLocale, { dateStyle: "long" }).format(d);
  })();

  return (
    <div className="auth-page legal-page blog-page">
      {authed ? (
        <NavDash active="" userDisplay={userDisplay} />
      ) : (
        <NavLanding active="" />
      )}
      <main id="main" className="auth-page-inner legal-page-inner blog-page-inner">
        <article className="auth-card auth-card--legal blog-post-card">
          <p className="legal-document-back">
            <Link href="/blog">{t("blog.back_to_index")}</Link>
          </p>
          <h1>{post.title}</h1>
          {publishedLabel ? (
            <p className="legal-document-updated">
              <time dateTime={post.published_at ?? undefined}>{publishedLabel}</time>
            </p>
          ) : null}
          {post.excerpt ? <p className="blog-post-excerpt">{post.excerpt}</p> : null}
          <BlogBbcodeContent bbcode={post.body_bbcode} />
        </article>
      </main>
      <SiteLandingFooter showAuthedActionLinks={authed} />
    </div>
  );
}

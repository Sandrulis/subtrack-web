import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostView } from "@/components/blog/blog-post-view";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";
import { bbcodeToPlainText } from "@/lib/blog/bbcode";
import { getPublishedBlogPostBySlug } from "@/lib/blog/blog-public";
import { getPublicSiteUrl } from "@/lib/site-url";
import { getPublicSystemSettings } from "@/lib/system-settings-public";
import { buildSiteShareOpenGraphTwitterEn } from "@/lib/seo/site-share-metadata";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) {
    return { title: "Blog" };
  }
  const description =
    post.excerpt.trim() || bbcodeToPlainText(post.body_bbcode, 160);
  const { systemName } = await getPublicSystemSettings();
  const share = buildSiteShareOpenGraphTwitterEn({
    brand: systemName,
    title: post.title,
    description,
    url: `${getPublicSiteUrl()}/blog/${post.slug}`,
  });
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    ...share,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();

  const userDisplay = await getSessionUserDisplaySafe();
  return <BlogPostView post={post} userDisplay={userDisplay} />;
}

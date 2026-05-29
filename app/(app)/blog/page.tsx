import type { Metadata } from "next";
import { BlogIndexView } from "@/components/blog/blog-index-view";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";
import { listPublishedBlogPosts } from "@/lib/blog/blog-public";
import { getPublicSiteUrl } from "@/lib/site-url";
import { getPublicSystemSettings } from "@/lib/system-settings-public";
import { buildSiteShareOpenGraphTwitterEn } from "@/lib/seo/site-share-metadata";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export async function generateMetadata(): Promise<Metadata> {
  const title = await getUiPhraseForRequest("meta.title.blog.index");
  const description = await getUiPhraseForRequest("blog.index.meta_description");
  const { systemName } = await getPublicSystemSettings();
  const share = buildSiteShareOpenGraphTwitterEn({
    brand: systemName,
    title,
    description,
    url: `${getPublicSiteUrl()}/blog`,
  });
  return {
    title,
    description,
    alternates: { canonical: "/blog" },
    ...share,
  };
}

export default async function BlogIndexPage() {
  const [posts, userDisplay] = await Promise.all([
    listPublishedBlogPosts(),
    getSessionUserDisplaySafe(),
  ]);

  return <BlogIndexView posts={posts} userDisplay={userDisplay} />;
}

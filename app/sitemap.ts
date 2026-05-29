import type { MetadataRoute } from "next";
import { listPublishedBlogSitemapEntries } from "@/lib/blog/blog-public";
import { SEARCH_CRAWL_SITEMAP_ENTRIES } from "@/lib/seo/search-crawl";
import { getPublicSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl();
  const staticEntries = SEARCH_CRAWL_SITEMAP_ENTRIES.map((entry) => ({
    url: `${siteUrl}${entry.path}`,
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  const blogPosts = await listPublishedBlogSitemapEntries();
  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.55,
  }));

  return [...staticEntries, ...blogEntries];
}

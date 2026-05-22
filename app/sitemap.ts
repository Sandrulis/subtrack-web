import type { MetadataRoute } from "next";
import { SEARCH_CRAWL_SITEMAP_ENTRIES } from "@/lib/seo/search-crawl";
import { getPublicSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getPublicSiteUrl();
  const lastModified = new Date();

  return SEARCH_CRAWL_SITEMAP_ENTRIES.map((entry) => ({
    url: `${siteUrl}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}

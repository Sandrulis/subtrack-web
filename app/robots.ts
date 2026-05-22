import type { MetadataRoute } from "next";
import { SEARCH_CRAWL_DISALLOW_PATHS } from "@/lib/seo/search-crawl";
import { getPublicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...SEARCH_CRAWL_DISALLOW_PATHS],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";
import {
  buildSiteShareOpenGraphTwitterForRequest,
  getBrandBylinePageTitle,
  getSiteShareDescription,
} from "@/lib/seo/site-share-metadata";

export async function getLandingPageTitle(brand: string): Promise<string> {
  return getBrandBylinePageTitle(brand);
}

export async function buildLandingPageMetadata(brand: string): Promise<Metadata> {
  const title = await getLandingPageTitle(brand);
  const description = await getSiteShareDescription(brand);
  const share = await buildSiteShareOpenGraphTwitterForRequest({
    brand,
    title,
    description,
    url: getPublicSiteUrl(),
  });

  return {
    title,
    description,
    alternates: {
      canonical: "/",
    },
    ...share,
  };
}

export type WebApplicationJsonLd = {
  "@context": "https://schema.org";
  "@type": "WebApplication";
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  browserRequirements: string;
};

export async function buildLandingWebApplicationJsonLd(
  brand: string,
): Promise<WebApplicationJsonLd> {
  const description = await getSiteShareDescription(brand);
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: brand,
    description,
    url: getPublicSiteUrl(),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
  };
}

import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";
import {
  buildSiteShareOpenGraphTwitterEn,
  buildSiteSharePageTitle,
  getSiteShareDescription,
  getSiteShareDescriptionEn,
} from "@/lib/seo/site-share-metadata";

export function getLandingPageTitle(brand: string): string {
  return buildSiteSharePageTitle(brand);
}

export async function buildLandingPageMetadata(brand: string): Promise<Metadata> {
  const title = getLandingPageTitle(brand);
  const description = getSiteShareDescriptionEn(brand);
  const share = buildSiteShareOpenGraphTwitterEn({
    brand,
    title,
    description,
    url: getPublicSiteUrl(),
  });

  return {
    title: { absolute: title },
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

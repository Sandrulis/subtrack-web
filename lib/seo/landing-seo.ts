import type { Metadata } from "next";
import { getPublicSiteOrigin, getPublicSiteUrl } from "@/lib/site-url";

export const LANDING_PAGE_DESCRIPTION =
  "Pārvaldi abonementus, rēķinus un citus periodiskos maksājumus vienuviet. Kalendārs, analītika un atgādinājumi vienkāršā un modernā panelī.";

export function landingPageTitle(brand: string): string {
  return `${brand} – abonementu un periodisko maksājumu pārvaldība`;
}

export function buildLandingPageMetadata(brand: string): Metadata {
  const title = landingPageTitle(brand);
  const siteOrigin = getPublicSiteOrigin();

  return {
    title,
    description: LANDING_PAGE_DESCRIPTION,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "lv_LV",
      url: siteOrigin.href,
      siteName: brand,
      title,
      description: LANDING_PAGE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: LANDING_PAGE_DESCRIPTION,
    },
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

export function buildLandingWebApplicationJsonLd(brand: string): WebApplicationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: brand,
    description: LANDING_PAGE_DESCRIPTION,
    url: getPublicSiteUrl(),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
  };
}

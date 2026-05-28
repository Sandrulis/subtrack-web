import type { Metadata } from "next";
import { cache } from "react";
import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";
import { applySystemNamePlaceholders } from "@/lib/system-name-placeholder";
import { getPublicSiteUrl } from "@/lib/site-url";
import { getUiPhraseForRequest, resolveRequestUiLocales } from "@/lib/ui/server-ui-phrases";

export const OPENGRAPH_IMAGE_PATH = "/opengraph-image";
export const OPENGRAPH_IMAGE_SIZE = { width: 1200, height: 630 } as const;

const SHARE_DESCRIPTION_FALLBACK =
  "Pārvaldi abonementus, rēķinus un citus periodiskos maksājumus vienuviet.";

/** OG / Twitter / dokumenta virsraksts dalīšanai (vienmēr angļu, neatkarīgi no UI lokāles). */
export const SITE_SHARE_TITLE_SUFFIX_EN =
  "subscription and recurring payment tracker";

export const SITE_SHARE_DESCRIPTION_EN =
  "Manage subscriptions, bills, and other recurring payments in one place.";

export function buildSiteSharePageTitle(brand: string): string {
  const trimmedBrand = brand.trim();
  return `${trimmedBrand} – ${SITE_SHARE_TITLE_SUFFIX_EN}`;
}

export function getSiteShareDescriptionEn(brand: string): string {
  const trimmedBrand = brand.trim();
  return SITE_SHARE_DESCRIPTION_EN.replace(/\{SYSTEM_NAME\}/g, trimmedBrand);
}

/** Open Graph `locale` (piem. `lv_LV`) no `languages.code`. */
export function localeCodeToOpenGraphLocale(code: string): string {
  const primary = code.trim().toLowerCase().split(/[-_]/)[0] ?? "en";
  const map: Record<string, string> = {
    lv: "lv_LV",
    en: "en_US",
    ru: "ru_RU",
    de: "de_DE",
    fr: "fr_FR",
    es: "es_ES",
    pt: "pt_PT",
  };
  return map[primary] ?? "en_US";
}

/** Dokumenta / OG virsraksts: `{brand} – {landing.footer.byline}` aktīvajā valodā. */
export async function getBrandBylinePageTitle(brand: string): Promise<string> {
  const trimmedBrand = brand.trim();
  const byline = await getUiPhraseForRequest("landing.footer.byline");
  let line = applySystemNamePlaceholders(byline, trimmedBrand).trim();
  if (!line || line === "landing.footer.byline") {
    const { locale } = await resolveRequestUiLocales();
    const fb = pickFallbackPhrase("landing.footer.byline", locale);
    line = fb ? applySystemNamePlaceholders(fb, trimmedBrand).trim() : "";
  }
  if (!line) {
    line =
      pickFallbackPhrase("landing.footer.byline", "en") ??
      "subscription and recurring payment tracker.";
  }
  return `${trimmedBrand} – ${line}`;
}

/** SEO / OG apraksts: `landing.hero.subtitle` ar `{SYSTEM_NAME}`, citādi footer byline. */
export const getSiteShareDescription = cache(async (brand: string): Promise<string> => {
  const subtitle = await getUiPhraseForRequest("landing.hero.subtitle");
  let desc = applySystemNamePlaceholders(subtitle, brand).trim();
  if (!desc || desc === "landing.hero.subtitle") {
    const byline = await getUiPhraseForRequest("landing.footer.byline");
    const line = applySystemNamePlaceholders(byline, brand).trim();
    desc = line ? `${brand.trim()} – ${line}` : brand.trim();
  }
  return desc || SHARE_DESCRIPTION_FALLBACK;
});

export type SiteShareGraphInput = {
  brand: string;
  title: string;
  description: string;
  /** Pilns `og:url` (bez beigu `/` – kā `getPublicSiteUrl()`). */
  url?: string;
  locale?: string;
};

export function buildSiteShareOpenGraphTwitter(
  input: SiteShareGraphInput,
): Pick<Metadata, "openGraph" | "twitter"> {
  const ogLocale = localeCodeToOpenGraphLocale(input.locale ?? "en");
  const ogUrl = input.url ?? getPublicSiteUrl();

  return {
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: ogUrl,
      siteName: input.brand,
      title: input.title,
      description: input.description,
      images: [
        {
          url: OPENGRAPH_IMAGE_PATH,
          ...OPENGRAPH_IMAGE_SIZE,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [OPENGRAPH_IMAGE_PATH],
    },
  };
}

/** OG/Twitter vienmēr angļu (`en_US`), lai atbilstu fiksētajam virsrakstam (crawleri bez LV sīkdatnes). */
export function buildSiteShareOpenGraphTwitterEn(
  input: Omit<SiteShareGraphInput, "locale">,
): Pick<Metadata, "openGraph" | "twitter"> {
  return buildSiteShareOpenGraphTwitter({ ...input, locale: "en" });
}

/** @deprecated Prefer `buildSiteShareOpenGraphTwitterEn` for share cards. */
export async function buildSiteShareOpenGraphTwitterForRequest(
  input: Omit<SiteShareGraphInput, "locale">,
): Promise<Pick<Metadata, "openGraph" | "twitter">> {
  return buildSiteShareOpenGraphTwitterEn(input);
}

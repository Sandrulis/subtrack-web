import type { Metadata } from "next";
import { getPublicSystemSettings } from "@/lib/system-settings-public";
import { getPublicSiteUrl } from "@/lib/site-url";
import { buildSiteShareOpenGraphTwitterEn } from "@/lib/seo/site-share-metadata";

/** Canonical + OG/Twitter ar pareizu `og:url` publiskām lapām (juridiskās, demo u.c.). */
export async function buildPublicPageMetadata(input: {
  canonicalPath: string;
  title: string;
  description?: string;
}): Promise<Metadata> {
  const path = input.canonicalPath.startsWith("/")
    ? input.canonicalPath
    : `/${input.canonicalPath}`;
  const { systemName } = await getPublicSystemSettings();
  const pageUrl = `${getPublicSiteUrl()}${path}`;
  const description = (input.description ?? input.title).trim();
  const share = buildSiteShareOpenGraphTwitterEn({
    brand: systemName,
    title: input.title,
    description,
    url: pageUrl,
  });

  return {
    title: input.title,
    description,
    alternates: { canonical: path },
    ...share,
  };
}

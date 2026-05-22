import { getPublicSiteUrl } from "@/lib/site-url";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/** Fiksēti failu nosaukumi mapē `brand` (public bucket). */
export const BRAND_STORAGE_FILES = [
  "icon-32.png",
  "icon-64.png",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
  "icon-512-maskable.png",
] as const;

export type BrandStorageFile = (typeof BRAND_STORAGE_FILES)[number];

export type PublicBrandLogoAssets = {
  revision: number;
  /** Topbar / kompakts UI (~36px). */
  topbar: string;
  icon32: string;
  icon64: string;
  apple180: string;
  icon192: string;
  icon512: string;
  maskable512: string;
};

export function buildBrandStoragePublicUrl(
  filename: BrandStorageFile,
  revision: number,
): string | null {
  const cfg = getSupabasePublicConfig();
  if (!cfg || revision <= 0) return null;
  const base = `${cfg.url.replace(/\/$/, "")}/storage/v1/object/public/brand/${filename}`;
  return `${base}?v=${revision}`;
}

/** Publisks logo URL uz pašu domēnu (`/brand/...`), nevis Supabase hostu. */
export function buildBrandSitePublicUrl(
  filename: BrandStorageFile,
  revision: number,
): string | null {
  if (revision <= 0) return null;
  const origin = getPublicSiteUrl().replace(/\/$/, "");
  return `${origin}/brand/${filename}?v=${revision}`;
}

export function resolvePublicBrandLogoAssets(revision: number): PublicBrandLogoAssets | null {
  if (revision <= 0) return null;
  const topbar = buildBrandSitePublicUrl("icon-64.png", revision);
  const icon32 = buildBrandSitePublicUrl("icon-32.png", revision);
  const icon64 = buildBrandSitePublicUrl("icon-64.png", revision);
  const apple180 = buildBrandSitePublicUrl("icon-180.png", revision);
  const icon192 = buildBrandSitePublicUrl("icon-192.png", revision);
  const icon512 = buildBrandSitePublicUrl("icon-512.png", revision);
  const maskable512 = buildBrandSitePublicUrl("icon-512-maskable.png", revision);
  if (!topbar || !icon32 || !icon64 || !apple180 || !icon192 || !icon512 || !maskable512) {
    return null;
  }
  return {
    revision,
    topbar,
    icon32,
    icon64,
    apple180,
    icon192,
    icon512,
    maskable512,
  };
}

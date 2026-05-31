import { getPublicSiteUrl } from "@/lib/site-url";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/** PWA / favicon ikonas (kvadrāts). */
export const BRAND_ICON_FILES = [
  "icon-32.png",
  "icon-64.png",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
  "icon-512-maskable.png",
] as const;

export type BrandIconFile = (typeof BRAND_ICON_FILES)[number];

export const BRAND_TOPBAR_FILE = "topbar-logo.png" as const;

/** Fiksēti failu nosaukumi mapē `brand` (public bucket). */
export const BRAND_STORAGE_FILES = [...BRAND_ICON_FILES, BRAND_TOPBAR_FILE] as const;

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

export function resolveTopbarLogoUrl(
  logoRevision: number,
  topbarLogoRevision: number,
): string | null {
  if (topbarLogoRevision > 0) {
    return buildBrandSitePublicUrl(BRAND_TOPBAR_FILE, topbarLogoRevision);
  }
  if (logoRevision > 0) {
    return buildBrandSitePublicUrl("icon-64.png", logoRevision);
  }
  return null;
}

export function resolvePublicBrandLogoAssets(
  logoRevision: number,
  topbarLogoRevision = 0,
): PublicBrandLogoAssets | null {
  const topbar = resolveTopbarLogoUrl(logoRevision, topbarLogoRevision);
  if (logoRevision <= 0) {
    if (!topbar) return null;
    return {
      revision: 0,
      topbar,
      icon32: "",
      icon64: "",
      apple180: "",
      icon192: "",
      icon512: "",
      maskable512: "",
    };
  }

  const icon32 = buildBrandSitePublicUrl("icon-32.png", logoRevision);
  const icon64 = buildBrandSitePublicUrl("icon-64.png", logoRevision);
  const apple180 = buildBrandSitePublicUrl("icon-180.png", logoRevision);
  const icon192 = buildBrandSitePublicUrl("icon-192.png", logoRevision);
  const icon512 = buildBrandSitePublicUrl("icon-512.png", logoRevision);
  const maskable512 = buildBrandSitePublicUrl("icon-512-maskable.png", logoRevision);
  if (!topbar || !icon32 || !icon64 || !apple180 || !icon192 || !icon512 || !maskable512) {
    return null;
  }
  return {
    revision: logoRevision,
    topbar,
    icon32,
    icon64,
    apple180,
    icon192,
    icon512,
    maskable512,
  };
}

import type { MetadataRoute } from "next";
import { disabledPwaSettings } from "@/lib/pwa/public-pwa-settings";
import { getPublicSiteOrigin } from "@/lib/site-url";
import { getPublicSystemSettings } from "@/lib/system-settings-public";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { systemName, brandLogo, pwa } = await getPublicSystemSettings();
  const origin = getPublicSiteOrigin();

  if (!pwa.enabled) {
    const off = disabledPwaSettings();
    return {
      name: systemName,
      short_name: off.shortName,
      display: "browser",
      start_url: "/",
      scope: "/",
    };
  }

  return {
    name: systemName,
    short_name: pwa.shortName,
    description:
      "Pārvaldi abonementus, rēķinus un citus periodiskos maksājumus vienuviet.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: pwa.themeColor,
    background_color: pwa.backgroundColor,
    icons: brandLogo
      ? [
          { src: brandLogo.icon32, sizes: "32x32", type: "image/png" },
          { src: brandLogo.apple180, sizes: "180x180", type: "image/png" },
          {
            src: brandLogo.icon192,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: brandLogo.icon512,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: brandLogo.maskable512,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ]
      : [
          {
            src: new URL("/icon", origin).href,
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: new URL("/apple-icon", origin).href,
            sizes: "180x180",
            type: "image/png",
          },
          {
            src: new URL("/icon/192", origin).href,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: new URL("/icon", origin).href,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: new URL("/icon/maskable", origin).href,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
  };
}

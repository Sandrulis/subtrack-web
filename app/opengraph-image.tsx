import { ImageResponse } from "next/og";
import { SubtrackBrandMark } from "@/lib/pwa/brand-mark";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import { landingPageTitle } from "@/lib/seo/landing-seo";
import { getPublicSystemSettings } from "@/lib/system-settings-public";

export const alt = landingPageTitle(DEFAULT_SYSTEM_NAME);
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const { systemName: brand, brandLogo } = await getPublicSystemSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #f0fdfa 0%, #f8fafc 48%, #f0f9ff 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 36,
          }}
        >
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brandLogo.icon192}
              alt=""
              width={72}
              height={72}
              style={{ borderRadius: 18, objectFit: "cover" }}
            />
          ) : (
            <SubtrackBrandMark />
          )}
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#1e1e2e",
              letterSpacing: "-0.02em",
            }}
          >
            {brand}
          </div>
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: "#1e1e2e",
            lineHeight: 1.25,
            maxWidth: 900,
            marginBottom: 28,
          }}
        >
          Abonementi un periodiskie maksājumi vienuviet
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#64748b",
            lineHeight: 1.4,
            maxWidth: 880,
          }}
        >
          Kalendārs, analītika un atgādinājumi vienkāršā panelī
        </div>
      </div>
    ),
    { ...size },
  );
}

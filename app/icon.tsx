import { ImageResponse } from "next/og";
import { RepazyBrandMark } from "@/lib/pwa/brand-mark";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export function generateImageMetadata() {
  return [
    { id: "default", size: { width: 512, height: 512 } },
    { id: "192", size: { width: 192, height: 192 } },
    { id: "maskable", size: { width: 512, height: 512 } },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const iconId = await id;
  const dim = iconId === "192" ? 192 : 512;
  const maskable = iconId === "maskable";
  const pad = maskable ? Math.round(dim * 0.12) : Math.round(dim * 0.08);
  const inner = dim - pad * 2;
  const letter = Math.round(inner * 0.42);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0fdfa 0%, #f8fafc 48%, #f0f9ff 100%)",
        }}
      >
        <RepazyBrandMark boxSize={inner} letterSize={letter} />
      </div>
    ),
    { width: dim, height: dim },
  );
}

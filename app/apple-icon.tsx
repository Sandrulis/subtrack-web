import { ImageResponse } from "next/og";
import { RepazyBrandMark } from "@/lib/pwa/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <RepazyBrandMark boxSize={140} letterSize={64} />
      </div>
    ),
    { ...size },
  );
}

import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Palīdz, ja .env.local netiek ielādēts (cwd / server puse).
loadEnvConfig(process.cwd());

/** M3 – CSP kā `report-only` (`frame-ancestors` utt.). Pēc pārbaudes var pastiprināt. */
const CSP_REPORT_ONLY = [
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

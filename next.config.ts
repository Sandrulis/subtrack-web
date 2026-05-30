import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Palīdz, ja .env.local netiek ielādēts (cwd / server puse).
loadEnvConfig(process.cwd());

/** M3 – CSP enforce (minimāls; bez script-src, lai Next.js bundļi netiktu bloķēti). */
const CONTENT_SECURITY_POLICY = [
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
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

export default withSentryConfig(nextConfig, {
  org: "repazy",
  project: "javascript-nextjs",

  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: !process.env.CI,

  widenClientFileUpload: true,

  // Tunelis tikai produkcijā (ad-blocker). Lokāli sūta tieši uz ingest.
  tunnelRoute: process.env.NODE_ENV === "production" ? "/monitoring" : undefined,
});

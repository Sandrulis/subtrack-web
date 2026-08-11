import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Palīdz, ja .env.local netiek ielādēts (cwd / server puse).
loadEnvConfig(process.cwd());

/** M3 – CSP enforce (paplašināts; script-src ar unsafe-inline Next bundļiem). */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
  }`,
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
  "font-src 'self' data: https://cdnjs.cloudflare.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.de.sentry.io",
  "worker-src 'self' blob:",
  "frame-src 'self' https://checkout.stripe.com https://billing.stripe.com",
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
      {
        source: "/fs/js/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/styles/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
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

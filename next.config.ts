import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Palīdz, ja .env.local netiek ielādēts (cwd / server puse).
loadEnvConfig(process.cwd());

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

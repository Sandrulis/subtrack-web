import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/** Tikai izstrādei: vai env ir redzams serverim. Nedod atslēgas. */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }
  const cfg = getSupabasePublicConfig();
  return NextResponse.json({
    cwd: process.cwd(),
    supabaseConfigured: cfg !== null,
    urlHost: cfg ? new URL(cfg.url).host : null,
  });
}

import { NextResponse } from "next/server";
import {
  BRAND_STORAGE_FILES,
  buildBrandStoragePublicUrl,
  type BrandStorageFile,
} from "@/lib/brand/logo-assets";

function parseRevision(searchParams: URLSearchParams): number {
  const raw = searchParams.get("v");
  const n =
    typeof raw === "string" ? Number.parseInt(raw, 10) : Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> },
): Promise<NextResponse> {
  const { filename } = await context.params;
  if (!BRAND_STORAGE_FILES.includes(filename as BrandStorageFile)) {
    return new NextResponse(null, { status: 404 });
  }

  const revision = parseRevision(new URL(request.url).searchParams);
  if (revision <= 0) {
    return new NextResponse(null, { status: 404 });
  }

  const upstream = buildBrandStoragePublicUrl(filename as BrandStorageFile, revision);
  if (!upstream) {
    return new NextResponse(null, { status: 404 });
  }

  const res = await fetch(upstream, { next: { revalidate: 86400 } });
  if (!res.ok) {
    return new NextResponse(null, { status: res.status === 404 ? 404 : 502 });
  }

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

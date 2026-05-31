import sharp from "sharp";
import { BRAND_TOPBAR_FILE } from "@/lib/brand/logo-assets";
import type { BrandStorageFile } from "@/lib/brand/logo-assets";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export type ProcessedBrandFile = {
  filename: BrandStorageFile;
  buffer: Buffer;
  contentType: "image/png";
};

function squarePng(source: Buffer, size: number): Promise<Buffer> {
  return sharp(source)
    .rotate()
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function maskablePng(source: Buffer): Promise<Buffer> {
  const dim = 512;
  const inner = Math.round(dim * 0.76);
  const pad = Math.floor((dim - inner) / 2);
  const innerBuf = await squarePng(source, inner);
  return sharp({
    create: {
      width: dim,
      height: dim,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    },
  })
    .composite([{ input: innerBuf, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

export async function processLogoUpload(
  file: File,
): Promise<{ ok: true; files: ProcessedBrandFile[] } | { ok: false; message: string }> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Izvēlies attēlu." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "Attēls ir pārāk liels (maks. 5 MB)." };
  }
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, message: "Atbalstīti formāti: PNG, JPEG, WebP." };
  }

  let source: Buffer;
  try {
    source = Buffer.from(await file.arrayBuffer());
    await sharp(source).metadata();
  } catch {
    return { ok: false, message: "Neizdevās nolasīt attēlu." };
  }

  try {
    const [icon32, icon64, icon180, icon192, icon512, maskable] = await Promise.all([
      squarePng(source, 32),
      squarePng(source, 64),
      squarePng(source, 180),
      squarePng(source, 192),
      squarePng(source, 512),
      maskablePng(source),
    ]);

    const files: ProcessedBrandFile[] = [
      { filename: "icon-32.png", buffer: icon32, contentType: "image/png" },
      { filename: "icon-64.png", buffer: icon64, contentType: "image/png" },
      { filename: "icon-180.png", buffer: icon180, contentType: "image/png" },
      { filename: "icon-192.png", buffer: icon192, contentType: "image/png" },
      { filename: "icon-512.png", buffer: icon512, contentType: "image/png" },
      { filename: "icon-512-maskable.png", buffer: maskable, contentType: "image/png" },
    ];

    return { ok: true, files };
  } catch {
    return { ok: false, message: "Neizdevās sagatavot ikonu izmērus." };
  }
}

const TOPBAR_MAX_WIDTH = 200;
const TOPBAR_MAX_HEIGHT = 72;

export type ProcessedTopbarLogoFile = {
  filename: typeof BRAND_TOPBAR_FILE;
  buffer: Buffer;
  contentType: "image/png";
};

export async function processTopbarLogoUpload(
  file: File,
): Promise<{ ok: true; files: ProcessedTopbarLogoFile[] } | { ok: false; message: string }> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Izvēlies attēlu." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "Attēls ir pārāk liels (maks. 5 MB)." };
  }
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, message: "Atbalstīti formāti: PNG, JPEG, WebP." };
  }

  let source: Buffer;
  try {
    source = Buffer.from(await file.arrayBuffer());
    await sharp(source).metadata();
  } catch {
    return { ok: false, message: "Neizdevās nolasīt attēlu." };
  }

  try {
    const buffer = await sharp(source)
      .rotate()
      .resize(TOPBAR_MAX_WIDTH, TOPBAR_MAX_HEIGHT, {
        fit: "inside",
        withoutEnlargement: false,
      })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();

    return {
      ok: true,
      files: [{ filename: BRAND_TOPBAR_FILE, buffer, contentType: "image/png" }],
    };
  } catch {
    return { ok: false, message: "Neizdevās sagatavot topbar logo." };
  }
}

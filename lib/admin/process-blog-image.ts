import sharp from "sharp";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export type ProcessedBlogImage =
  | {
      ok: true;
      buffer: Buffer;
      contentType: "image/webp";
      ext: "webp";
    }
  | { ok: false; message: string };

/**
 * Validē un pārkodē blog attēlu (sharp) – neatstāj klienta MIME / baitus.
 * GIF → pirmā kadra WebP (nav animācijas saglabāšanas).
 */
export async function processBlogImageUpload(file: File): Promise<ProcessedBlogImage> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Nav attēla faila." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Fails lielāks par 5 MB." };
  }
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED.has(mime)) {
    return { ok: false, message: "Atļauti PNG, JPEG, WebP vai GIF." };
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
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { ok: true, buffer, contentType: "image/webp", ext: "webp" };
  } catch {
    return { ok: false, message: "Neizdevās sagatavot attēlu." };
  }
}

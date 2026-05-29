"use server";

import { randomUUID } from "crypto";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export type BlogImageUploadResult =
  | { ok: true; publicUrl: string; bbcode: string }
  | { ok: false; message: string };

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

function publicObjectUrl(path: string): string | null {
  const cfg = getSupabasePublicConfig();
  if (!cfg) return null;
  const base = cfg.url.replace(/\/$/, "");
  const encoded = path
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/");
  return `${base}/storage/v1/object/public/blog/${encoded}`;
}

export async function uploadBlogImageAction(
  formData: FormData,
): Promise<BlogImageUploadResult> {
  await requireAdminUser();

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return { ok: false, message: "Nav attēla faila." };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, message: "Atļauti PNG, JPEG, WebP vai GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Fails lielāks par 5 MB." };
  }

  const service = createServiceRoleSupabaseClient();
  const supabase = service ?? (await createServerSupabaseClient());

  const ext = extForMime(file.type);
  const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("blog").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
    cacheControl: "31536000",
  });

  if (error) {
    const hint = /bucket/i.test(error.message)
      ? " Palaid database/supabase/154_blog_storage.sql."
      : "";
    return { ok: false, message: `${error.message}${hint}` };
  }

  const publicUrl = publicObjectUrl(path);
  if (!publicUrl) {
    return { ok: false, message: "Neizdevās izveidot publisko URL." };
  }

  const bbcode = `[img]${publicUrl}[/img]`;
  return { ok: true, publicUrl, bbcode };
}

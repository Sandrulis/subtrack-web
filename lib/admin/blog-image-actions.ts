"use server";

import { randomUUID } from "crypto";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { processBlogImageUpload } from "@/lib/admin/process-blog-image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export type BlogImageUploadResult =
  | { ok: true; publicUrl: string; bbcode: string }
  | { ok: false; message: string };

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

  const processed = await processBlogImageUpload(file);
  if (!processed.ok) {
    return { ok: false, message: processed.message };
  }

  const service = createServiceRoleSupabaseClient();
  const supabase = service ?? (await createServerSupabaseClient());

  const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${processed.ext}`;

  const { error } = await supabase.storage.from("blog").upload(path, processed.buffer, {
    contentType: processed.contentType,
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

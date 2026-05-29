"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { bbcodeToPlainText } from "@/lib/blog/bbcode";
import { ensureUniqueBlogSlug, isValidBlogSlug, titleToBlogSlug } from "@/lib/blog/slug";
import type { AdminBlogPostRow } from "@/lib/blog/blog-types";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type BlogActionResult = { ok: true } | { ok: false; message: string };

const TITLE_MAX = 200;
const EXCERPT_MAX = 500;
const BODY_MAX = 100000;
const BLOG_PUBLIC_TAG = "blog-public";

function migrationHint(message: string): string {
  if (/relation .* does not exist/i.test(message) || /schema cache/i.test(message)) {
    return "Migrācija database/supabase/153_blog_posts.sql vēl nav palaista.";
  }
  return message;
}

function readTrimmed(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readBool(formData: FormData, key: string): boolean {
  const v = readTrimmed(formData, key);
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function mapRow(raw: Record<string, unknown>): AdminBlogPostRow | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  const slug = typeof raw.slug === "string" ? raw.slug : "";
  const title = typeof raw.title === "string" ? raw.title : "";
  if (!id || !slug || !title) return null;
  return {
    id,
    slug,
    title,
    excerpt: typeof raw.excerpt === "string" ? raw.excerpt : "",
    body_bbcode: typeof raw.body_bbcode === "string" ? raw.body_bbcode : "",
    is_published: Boolean(raw.is_published),
    published_at:
      typeof raw.published_at === "string" && raw.published_at ? raw.published_at : null,
    sort_order:
      typeof raw.sort_order === "number"
        ? raw.sort_order
        : Number.parseInt(String(raw.sort_order ?? "0"), 10) || 0,
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : "",
  };
}

async function afterBlogMutation() {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidateTag(BLOG_PUBLIC_TAG, "default");
}

export async function loadAdminBlogPostsForPage(): Promise<{
  rows: AdminBlogPostRow[];
  loadError: string | null;
}> {
  await requireAdminUser();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, body_bbcode, is_published, published_at, sort_order, created_at, updated_at",
    )
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { rows: [], loadError: migrationHint(error.message) };
  }

  const rows = (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((r): r is AdminBlogPostRow => r !== null);

  return { rows, loadError: null };
}

async function slugTaken(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  slug: string,
  excludeId?: string | null,
): Promise<boolean> {
  let q = supabase.from("blog_posts").select("id").eq("slug", slug).limit(1);
  if (excludeId) q = q.neq("id", excludeId);
  const { data } = await q.maybeSingle();
  return Boolean(data?.id);
}

function validateTitle(title: string): string | null {
  const t = title.trim();
  if (t.length < 2) return "Norādi virsrakstu (vismaz 2 rakstzīmes).";
  if (t.length > TITLE_MAX) return `Virsraksts līdz ${TITLE_MAX} rakstzīmēm.`;
  return null;
}

function validateBody(body: string): string | null {
  if (body.length > BODY_MAX) return `Saturs līdz ${BODY_MAX} rakstzīmēm.`;
  return null;
}

export async function createBlogPostAction(formData: FormData): Promise<BlogActionResult> {
  await requireAdminUser();
  const title = readTrimmed(formData, "title");
  const titleErr = validateTitle(title);
  if (titleErr) return { ok: false, message: titleErr };

  const body = String(formData.get("body_bbcode") ?? "");
  const bodyErr = validateBody(body);
  if (bodyErr) return { ok: false, message: bodyErr };

  let excerpt = readTrimmed(formData, "excerpt");
  if (excerpt.length > EXCERPT_MAX) {
    return { ok: false, message: `Ievads līdz ${EXCERPT_MAX} rakstzīmēm.` };
  }
  if (!excerpt) excerpt = bbcodeToPlainText(body, 240);

  const isPublished = readBool(formData, "is_published");

  const supabase = await createServerSupabaseClient();
  const baseSlug = titleToBlogSlug(title);
  if (!isValidBlogSlug(baseSlug)) {
    return { ok: false, message: "Norādi virsrakstu, no kura var izveidot URL (vismaz 2 rakstzīmes)." };
  }

  const slug = await ensureUniqueBlogSlug(baseSlug, (s) => slugTaken(supabase, s));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publishedAt = isPublished ? new Date().toISOString() : null;

  const { error } = await supabase.from("blog_posts").insert({
    slug,
    title: title.trim(),
    excerpt,
    body_bbcode: body,
    is_published: isPublished,
    published_at: publishedAt,
    created_by: user?.id ?? null,
  });

  if (error) return { ok: false, message: migrationHint(error.message) };
  await afterBlogMutation();
  return { ok: true };
}

export async function updateBlogPostAction(formData: FormData): Promise<BlogActionResult> {
  await requireAdminUser();
  const id = readTrimmed(formData, "id");
  if (!id) return { ok: false, message: "Trūkst ieraksta ID." };

  const title = readTrimmed(formData, "title");
  const titleErr = validateTitle(title);
  if (titleErr) return { ok: false, message: titleErr };

  const body = String(formData.get("body_bbcode") ?? "");
  const bodyErr = validateBody(body);
  if (bodyErr) return { ok: false, message: bodyErr };

  let excerpt = readTrimmed(formData, "excerpt");
  if (excerpt.length > EXCERPT_MAX) {
    return { ok: false, message: `Ievads līdz ${EXCERPT_MAX} rakstzīmēm.` };
  }
  if (!excerpt) excerpt = bbcodeToPlainText(body, 240);

  const isPublished = readBool(formData, "is_published");

  const supabase = await createServerSupabaseClient();
  const baseSlug = titleToBlogSlug(title);
  if (!isValidBlogSlug(baseSlug)) {
    return { ok: false, message: "Norādi virsrakstu, no kura var izveidot URL (vismaz 2 rakstzīmes)." };
  }

  const slug = await ensureUniqueBlogSlug(baseSlug, (s) => slugTaken(supabase, s, id));

  const { data: existing, error: readErr } = await supabase
    .from("blog_posts")
    .select("is_published, published_at")
    .eq("id", id)
    .maybeSingle();

  if (readErr) return { ok: false, message: migrationHint(readErr.message) };
  if (!existing) return { ok: false, message: "Ieraksts nav atrasts." };

  let publishedAt: string | null =
    typeof existing.published_at === "string" ? existing.published_at : null;
  if (isPublished) {
    if (!publishedAt) publishedAt = new Date().toISOString();
  } else {
    publishedAt = null;
  }

  const { error } = await supabase
    .from("blog_posts")
    .update({
      slug,
      title: title.trim(),
      excerpt,
      body_bbcode: body,
      is_published: isPublished,
      published_at: publishedAt,
    })
    .eq("id", id);

  if (error) return { ok: false, message: migrationHint(error.message) };
  await afterBlogMutation();
  revalidatePath(`/blog/${slug}`);
  return { ok: true };
}

export async function deleteBlogPostAction(formData: FormData): Promise<BlogActionResult> {
  await requireAdminUser();
  const id = readTrimmed(formData, "id");
  if (!id) return { ok: false, message: "Trūkst ieraksta ID." };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, message: migrationHint(error.message) };
  await afterBlogMutation();
  return { ok: true };
}

export async function setBlogPostPublishedAction(
  formData: FormData,
): Promise<BlogActionResult> {
  await requireAdminUser();
  const id = readTrimmed(formData, "id");
  const isPublished = readBool(formData, "is_published");
  if (!id) return { ok: false, message: "Trūkst ieraksta ID." };

  const supabase = await createServerSupabaseClient();
  const publishedAt = isPublished ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("blog_posts")
    .update({
      is_published: isPublished,
      published_at: publishedAt,
    })
    .eq("id", id);

  if (error) return { ok: false, message: migrationHint(error.message) };
  await afterBlogMutation();
  return { ok: true };
}

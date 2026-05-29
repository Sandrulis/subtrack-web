import { unstable_cache } from "next/cache";
import type { BlogPostListItem, BlogPostRow } from "@/lib/blog/blog-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role-client";

function mapListRow(raw: Record<string, unknown>): BlogPostListItem | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  const slug = typeof raw.slug === "string" ? raw.slug : "";
  const title = typeof raw.title === "string" ? raw.title : "";
  if (!id || !slug || !title) return null;
  return {
    id,
    slug,
    title,
    excerpt: typeof raw.excerpt === "string" ? raw.excerpt : "",
    published_at:
      typeof raw.published_at === "string" && raw.published_at ? raw.published_at : null,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : "",
  };
}

function mapPostRow(raw: Record<string, unknown>): BlogPostRow | null {
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

async function getBlogReadClient() {
  const service = createServiceRoleSupabaseClient();
  if (service) return service;
  return createServerSupabaseClient();
}

const BLOG_PUBLIC_CACHE_TAG = "blog-public";

async function fetchHasPublishedBlogPosts(): Promise<boolean> {
  try {
    const supabase = await getBlogReadClient();
    const { count, error } = await supabase
      .from("blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true);
    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export const hasPublishedBlogPosts = unstable_cache(
  fetchHasPublishedBlogPosts,
  ["blog-has-published"],
  { tags: [BLOG_PUBLIC_CACHE_TAG], revalidate: 60 },
);

export async function listPublishedBlogPosts(): Promise<BlogPostListItem[]> {
  try {
    const supabase = await getBlogReadClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, published_at, updated_at")
      .eq("is_published", true)
      .order("sort_order", { ascending: false })
      .order("published_at", { ascending: false });
    if (error || !data) return [];
    return data
      .map((row) => mapListRow(row as Record<string, unknown>))
      .filter((r): r is BlogPostListItem => r !== null);
  } catch {
    return [];
  }
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPostRow | null> {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) return null;
    try {
      const supabase = await getBlogReadClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, body_bbcode, is_published, published_at, sort_order, created_at, updated_at",
        )
        .eq("is_published", true)
        .eq("slug", normalized)
        .maybeSingle();
      if (error || !data) return null;
      return mapPostRow(data as Record<string, unknown>);
    } catch {
      return null;
    }
}

export async function listPublishedBlogSitemapEntries(): Promise<
  { slug: string; updated_at: string }[]
> {
    try {
      const supabase = await getBlogReadClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error || !data) return [];
      return data
        .map((row) => {
          const slug = typeof row.slug === "string" ? row.slug : "";
          const updated_at = typeof row.updated_at === "string" ? row.updated_at : "";
          return slug ? { slug, updated_at } : null;
        })
        .filter((r): r is { slug: string; updated_at: string } => r !== null);
    } catch {
      return [];
    }
}

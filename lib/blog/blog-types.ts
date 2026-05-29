export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_bbcode: string;
  is_published: boolean;
  published_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BlogPostListItem = Pick<
  BlogPostRow,
  "id" | "slug" | "title" | "excerpt" | "published_at" | "updated_at"
>;

export type AdminBlogPostRow = BlogPostRow;

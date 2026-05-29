-- SubTrack: publisks blogs (admin CRUD, BBCode saturs, slug URL).
-- Palaid pēc 152_user_feedback_star_rating.sql.

-- -----------------------------------------------------------------------------
-- blog_posts
-- -----------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text not null default '',
  body_bbcode text not null default '',
  is_published boolean not null default false,
  published_at timestamptz,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_chk check (
    slug = btrim(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 2 and 120
  ),
  constraint blog_posts_title_chk check (
    char_length(btrim(title)) between 2 and 200
  ),
  constraint blog_posts_excerpt_len_chk check (char_length(excerpt) <= 500),
  constraint blog_posts_body_len_chk check (char_length(body_bbcode) <= 100000),
  constraint blog_posts_sort_order_chk check (sort_order >= 0),
  constraint blog_posts_published_at_chk check (
    (is_published = false and published_at is null)
    or (is_published = true and published_at is not null)
  )
);

comment on table public.blog_posts is
  'Publiski bloga ieraksti; saturs BBCode; URL /blog/{slug}.';

create unique index if not exists blog_posts_slug_uidx on public.blog_posts (slug);

create index if not exists blog_posts_published_list_idx
  on public.blog_posts (is_published, sort_order desc, published_at desc nulls last);

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.blog_posts enable row level security;

drop policy if exists "blog_posts_select_published" on public.blog_posts;
create policy "blog_posts_select_published"
  on public.blog_posts for select
  to anon, authenticated
  using (is_published = true);

drop policy if exists "blog_posts_select_admin" on public.blog_posts;
create policy "blog_posts_select_admin"
  on public.blog_posts for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "blog_posts_insert_admin" on public.blog_posts;
create policy "blog_posts_insert_admin"
  on public.blog_posts for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "blog_posts_update_admin" on public.blog_posts;
create policy "blog_posts_update_admin"
  on public.blog_posts for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "blog_posts_delete_admin" on public.blog_posts;
create policy "blog_posts_delete_admin"
  on public.blog_posts for delete
  to authenticated
  using (public.current_user_is_admin());

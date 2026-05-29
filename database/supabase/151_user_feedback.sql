-- SubTrack: lietotāju atsauksmes ar balsošanu (modālis); apstiprinātās rāda landing.
-- Palaid pēc 150_user_suggestions.sql.

-- -----------------------------------------------------------------------------
-- user_feedback
-- -----------------------------------------------------------------------------
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  approved_for_landing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_feedback_body_chk check (
    char_length(btrim(body)) between 10 and 1200
  )
);

comment on table public.user_feedback is
  'Lietotāju atsauksmes; approved_for_landing = true var rādīt sākumlapā.';
comment on column public.user_feedback.approved_for_landing is
  'Admin apstiprina publicēšanai landing (pagaidām SQL / nākotnē admin UI).';

create index if not exists user_feedback_created_idx
  on public.user_feedback (created_at desc);

create index if not exists user_feedback_landing_idx
  on public.user_feedback (approved_for_landing, created_at desc)
  where approved_for_landing = true;

drop trigger if exists user_feedback_set_updated_at on public.user_feedback;
create trigger user_feedback_set_updated_at
  before update on public.user_feedback
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_feedback_votes
-- -----------------------------------------------------------------------------
create table if not exists public.user_feedback_votes (
  feedback_id uuid not null references public.user_feedback (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (feedback_id, user_id)
);

comment on table public.user_feedback_votes is
  'Balsis (thumbs up) par user_feedback.';

create index if not exists user_feedback_votes_user_idx
  on public.user_feedback_votes (user_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.user_feedback enable row level security;
alter table public.user_feedback_votes enable row level security;

drop policy if exists "user_feedback_select_authenticated" on public.user_feedback;
create policy "user_feedback_select_authenticated"
  on public.user_feedback for select
  to authenticated
  using (true);

drop policy if exists "user_feedback_select_landing_public" on public.user_feedback;
create policy "user_feedback_select_landing_public"
  on public.user_feedback for select
  to anon, authenticated
  using (approved_for_landing = true);

drop policy if exists "user_feedback_insert_own" on public.user_feedback;
create policy "user_feedback_insert_own"
  on public.user_feedback for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_feedback_delete_own" on public.user_feedback;
create policy "user_feedback_delete_own"
  on public.user_feedback for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_feedback_delete_admin" on public.user_feedback;
create policy "user_feedback_delete_admin"
  on public.user_feedback for delete
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "user_feedback_update_admin_landing" on public.user_feedback;
create policy "user_feedback_update_admin_landing"
  on public.user_feedback for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "user_feedback_votes_select_all" on public.user_feedback_votes;
create policy "user_feedback_votes_select_all"
  on public.user_feedback_votes for select
  to authenticated
  using (true);

drop policy if exists "user_feedback_votes_insert_own" on public.user_feedback_votes;
create policy "user_feedback_votes_insert_own"
  on public.user_feedback_votes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_feedback_votes_delete_own" on public.user_feedback_votes;
create policy "user_feedback_votes_delete_own"
  on public.user_feedback_votes for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Saraksts modālim (visas atsauksmes, ielogotiem)
-- -----------------------------------------------------------------------------
create or replace function public.list_user_feedback()
returns table (
  id uuid,
  user_id uuid,
  body text,
  approved_for_landing boolean,
  created_at timestamptz,
  vote_count bigint,
  viewer_voted boolean,
  author_display text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    f.id,
    f.user_id,
    f.body,
    f.approved_for_landing,
    f.created_at,
    coalesce(vc.cnt, 0)::bigint as vote_count,
    exists (
      select 1
      from public.user_feedback_votes v
      where v.feedback_id = f.id
        and v.user_id = auth.uid()
    ) as viewer_voted,
    coalesce(
      nullif(btrim(concat_ws(' ', u.name, u.surname)), ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ) as author_display
  from public.user_feedback f
  inner join public.users u on u.id = f.user_id
  left join lateral (
    select count(*)::bigint as cnt
    from public.user_feedback_votes v
    where v.feedback_id = f.id
  ) vc on true
  order by vote_count desc, f.created_at desc
  limit 200;
$$;

grant execute on function public.list_user_feedback() to authenticated;

-- -----------------------------------------------------------------------------
-- Landing: tikai apstiprinātās (anon + authenticated)
-- -----------------------------------------------------------------------------
create or replace function public.list_landing_feedback()
returns table (
  id uuid,
  body text,
  vote_count bigint,
  author_display text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    f.id,
    f.body,
    coalesce(vc.cnt, 0)::bigint as vote_count,
    coalesce(
      nullif(btrim(concat_ws(' ', u.name, u.surname)), ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ) as author_display,
    f.created_at
  from public.user_feedback f
  inner join public.users u on u.id = f.user_id
  left join lateral (
    select count(*)::bigint as cnt
    from public.user_feedback_votes v
    where v.feedback_id = f.id
  ) vc on true
  where f.approved_for_landing = true
  order by vote_count desc, f.created_at desc
  limit 24;
$$;

grant execute on function public.list_landing_feedback() to anon, authenticated;

comment on function public.list_landing_feedback() is
  'Publiskas atsauksmes sākumlapai (tikai approved_for_landing).';

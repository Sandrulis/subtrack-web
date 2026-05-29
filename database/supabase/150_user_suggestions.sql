-- SubTrack: lietotāju ieteikumi / pieprasījumi ar balsošanu (modālis panelī).
-- Palaid pēc 149_system_settings_support_contact_email.sql.

-- -----------------------------------------------------------------------------
-- user_suggestions
-- -----------------------------------------------------------------------------
create table if not exists public.user_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_suggestions_title_chk check (
    char_length(btrim(title)) between 3 and 160
  ),
  constraint user_suggestions_body_chk check (
    char_length(body) between 10 and 2000
  )
);

comment on table public.user_suggestions is
  'Ielogotu lietotāju funkciju ieteikumi un pieprasījumi; kārtots pēc balsu skaita.';

create index if not exists user_suggestions_created_idx
  on public.user_suggestions (created_at desc);

drop trigger if exists user_suggestions_set_updated_at on public.user_suggestions;
create trigger user_suggestions_set_updated_at
  before update on public.user_suggestions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_suggestion_votes (viens balss uz ieteikumu)
-- -----------------------------------------------------------------------------
create table if not exists public.user_suggestion_votes (
  suggestion_id uuid not null references public.user_suggestions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (suggestion_id, user_id)
);

comment on table public.user_suggestion_votes is
  'Balsis par user_suggestions; viens lietotājs – viena balss uz ieteikumu.';

create index if not exists user_suggestion_votes_user_idx
  on public.user_suggestion_votes (user_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.user_suggestions enable row level security;
alter table public.user_suggestion_votes enable row level security;

drop policy if exists "user_suggestions_select_authenticated" on public.user_suggestions;
create policy "user_suggestions_select_authenticated"
  on public.user_suggestions for select
  to authenticated
  using (true);

drop policy if exists "user_suggestions_insert_own" on public.user_suggestions;
create policy "user_suggestions_insert_own"
  on public.user_suggestions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_suggestions_delete_own" on public.user_suggestions;
create policy "user_suggestions_delete_own"
  on public.user_suggestions for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_suggestions_delete_admin" on public.user_suggestions;
create policy "user_suggestions_delete_admin"
  on public.user_suggestions for delete
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "user_suggestion_votes_select_authenticated" on public.user_suggestion_votes;
create policy "user_suggestion_votes_select_authenticated"
  on public.user_suggestion_votes for select
  to authenticated
  using (true);

drop policy if exists "user_suggestion_votes_insert_own" on public.user_suggestion_votes;
create policy "user_suggestion_votes_insert_own"
  on public.user_suggestion_votes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_suggestion_votes_delete_own" on public.user_suggestion_votes;
create policy "user_suggestion_votes_delete_own"
  on public.user_suggestion_votes for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Saraksts ar balsu skaitu (SECURITY INVOKER)
-- -----------------------------------------------------------------------------
create or replace function public.list_user_suggestions()
returns table (
  id uuid,
  user_id uuid,
  title text,
  body text,
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
    s.id,
    s.user_id,
    s.title,
    s.body,
    s.created_at,
    coalesce(vc.cnt, 0)::bigint as vote_count,
    exists (
      select 1
      from public.user_suggestion_votes v
      where v.suggestion_id = s.id
        and v.user_id = auth.uid()
    ) as viewer_voted,
    coalesce(
      nullif(btrim(concat_ws(' ', u.name, u.surname)), ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ) as author_display
  from public.user_suggestions s
  inner join public.users u on u.id = s.user_id
  left join lateral (
    select count(*)::bigint as cnt
    from public.user_suggestion_votes v
    where v.suggestion_id = s.id
  ) vc on true
  order by vote_count desc, s.created_at desc
  limit 200;
$$;

comment on function public.list_user_suggestions() is
  'Ieteikumu saraksts ar balsīm; viewer_voted = pašreizējā sesija.';

grant execute on function public.list_user_suggestions() to authenticated;

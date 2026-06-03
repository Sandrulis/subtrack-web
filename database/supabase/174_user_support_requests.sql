-- SubTrack: atbalsta ziņojumi DB (papildus e-pastam uz support_contact_email).
-- Palaid pēc 149_system_settings_support_contact_email.sql.

-- -----------------------------------------------------------------------------
-- user_support_requests
-- -----------------------------------------------------------------------------
create table if not exists public.user_support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  email_sent boolean not null default false,
  created_at timestamptz not null default now(),
  constraint user_support_requests_message_chk check (
    char_length(btrim(message)) between 10 and 4000
  )
);

comment on table public.user_support_requests is
  'Ielogotu lietotāju atbalsta ziņojumi; kopā ar e-pastu uz system_settings.support_contact_email.';

create index if not exists user_support_requests_created_idx
  on public.user_support_requests (created_at desc);

create index if not exists user_support_requests_user_idx
  on public.user_support_requests (user_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.user_support_requests enable row level security;

drop policy if exists "user_support_requests_insert_own" on public.user_support_requests;
create policy "user_support_requests_insert_own"
  on public.user_support_requests for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_support_requests_select_admin" on public.user_support_requests;
create policy "user_support_requests_select_admin"
  on public.user_support_requests for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "user_support_requests_delete_admin" on public.user_support_requests;
create policy "user_support_requests_delete_admin"
  on public.user_support_requests for delete
  to authenticated
  using (public.current_user_is_admin());

-- -----------------------------------------------------------------------------
-- Admin saraksti (tikai is_admin > 0)
-- -----------------------------------------------------------------------------
create or replace function public.list_admin_user_suggestions()
returns table (
  id uuid,
  user_id uuid,
  title text,
  body text,
  created_at timestamptz,
  vote_count bigint,
  author_display text,
  author_email text
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
    coalesce(
      nullif(btrim(concat_ws(' ', u.name, u.surname)), ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ) as author_display,
    coalesce(u.email, '') as author_email
  from public.user_suggestions s
  inner join public.users u on u.id = s.user_id
  left join lateral (
    select count(*)::bigint as cnt
    from public.user_suggestion_votes v
    where v.suggestion_id = s.id
  ) vc on true
  where public.current_user_is_admin()
  order by vote_count desc, s.created_at desc
  limit 500;
$$;

comment on function public.list_admin_user_suggestions() is
  'Admin: visi ieteikumi ar balsīm un autora e-pastu.';

grant execute on function public.list_admin_user_suggestions() to authenticated;

create or replace function public.list_admin_user_feedback()
returns table (
  id uuid,
  user_id uuid,
  body text,
  star_rating smallint,
  approved_for_landing boolean,
  created_at timestamptz,
  updated_at timestamptz,
  author_display text,
  author_email text
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
    f.star_rating,
    f.approved_for_landing,
    f.created_at,
    f.updated_at,
    coalesce(
      nullif(btrim(concat_ws(' ', u.name, u.surname)), ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ) as author_display,
    coalesce(u.email, '') as author_email
  from public.user_feedback f
  inner join public.users u on u.id = f.user_id
  where public.current_user_is_admin()
  order by f.star_rating desc, f.created_at desc
  limit 500;
$$;

comment on function public.list_admin_user_feedback() is
  'Admin: visas atsauksmes ar zvaigžņu vērtējumu.';

grant execute on function public.list_admin_user_feedback() to authenticated;

create or replace function public.list_admin_user_support_requests()
returns table (
  id uuid,
  user_id uuid,
  message text,
  email_sent boolean,
  created_at timestamptz,
  author_display text,
  author_email text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    r.id,
    r.user_id,
    r.message,
    r.email_sent,
    r.created_at,
    coalesce(
      nullif(btrim(concat_ws(' ', u.name, u.surname)), ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ) as author_display,
    coalesce(u.email, '') as author_email
  from public.user_support_requests r
  inner join public.users u on u.id = r.user_id
  where public.current_user_is_admin()
  order by r.created_at desc
  limit 500;
$$;

comment on function public.list_admin_user_support_requests() is
  'Admin: atbalsta ziņojumi no Palīdzība modāļa.';

grant execute on function public.list_admin_user_support_requests() to authenticated;

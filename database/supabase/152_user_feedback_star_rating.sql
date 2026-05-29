-- SubTrack: atsauksmes ar zvaigžņu vērtējumu (0–5), viens ieraksts uz lietotāju; noņem thumbs-up balsis.
-- Palaid pēc 151_user_feedback.sql.

-- -----------------------------------------------------------------------------
-- star_rating + viens ieraksts / lietotājs
-- -----------------------------------------------------------------------------
alter table public.user_feedback
  add column if not exists star_rating smallint not null default 0;

alter table public.user_feedback drop constraint if exists user_feedback_star_rating_chk;
alter table public.user_feedback
  add constraint user_feedback_star_rating_chk check (
    star_rating >= 0
    and star_rating <= 5
  );

comment on column public.user_feedback.star_rating is
  'Lietotāja vērtējums 0–5 zvaigznēm (individuāli katram kontam).';

create unique index if not exists user_feedback_user_id_unique
  on public.user_feedback (user_id);

-- -----------------------------------------------------------------------------
-- Noņem balsošanas tabulu (aizstāj star_rating)
-- -----------------------------------------------------------------------------
drop table if exists public.user_feedback_votes cascade;

-- -----------------------------------------------------------------------------
-- Lietotājs var labot savu atsauksmi (teksts + vērtējums)
-- -----------------------------------------------------------------------------
drop policy if exists "user_feedback_update_own" on public.user_feedback;
create policy "user_feedback_update_own"
  on public.user_feedback for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Tikai admin maina approved_for_landing (ne lietotājs caur API)
-- -----------------------------------------------------------------------------
create or replace function public.user_feedback_guard_landing_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin()
     and new.approved_for_landing is distinct from old.approved_for_landing then
    new.approved_for_landing := old.approved_for_landing;
  end if;
  return new;
end;
$$;

drop trigger if exists user_feedback_guard_landing_flag on public.user_feedback;
create trigger user_feedback_guard_landing_flag
  before update on public.user_feedback
  for each row execute function public.user_feedback_guard_landing_flag();

-- -----------------------------------------------------------------------------
-- Saraksts modālim
-- -----------------------------------------------------------------------------
drop function if exists public.list_user_feedback();

create or replace function public.list_user_feedback()
returns table (
  id uuid,
  user_id uuid,
  body text,
  star_rating smallint,
  approved_for_landing boolean,
  created_at timestamptz,
  updated_at timestamptz,
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
    f.star_rating,
    f.approved_for_landing,
    f.created_at,
    f.updated_at,
    coalesce(
      nullif(btrim(concat_ws(' ', u.name, u.surname)), ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ) as author_display
  from public.user_feedback f
  inner join public.users u on u.id = f.user_id
  order by f.star_rating desc, f.created_at desc
  limit 200;
$$;

grant execute on function public.list_user_feedback() to authenticated;

-- -----------------------------------------------------------------------------
-- Landing: apstiprinātās ar vērtējumu
-- -----------------------------------------------------------------------------
drop function if exists public.list_landing_feedback();

create or replace function public.list_landing_feedback()
returns table (
  id uuid,
  body text,
  star_rating smallint,
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
    f.star_rating,
    coalesce(
      nullif(btrim(concat_ws(' ', u.name, u.surname)), ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ) as author_display,
    f.created_at
  from public.user_feedback f
  inner join public.users u on u.id = f.user_id
  where f.approved_for_landing = true
  order by f.star_rating desc, f.created_at desc
  limit 24;
$$;

grant execute on function public.list_landing_feedback() to anon, authenticated;

comment on function public.list_landing_feedback() is
  'Apstiprinātās atsauksmes sākumlapai ar star_rating (0–5).';

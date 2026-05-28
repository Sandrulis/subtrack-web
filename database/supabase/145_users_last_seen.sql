-- Pēdējā aktivitāte sistēmā (pieslēgšanās, lapas ielāde). Admin saraksts / nākotnes loģika.
-- Palaid pēc 015_users_rls_protect_privileged_columns.sql (last_seen nav aizsargāts lauks).

alter table public.users
  add column if not exists last_seen timestamptz;

comment on column public.users.last_seen is
  'Pēdējo reizi lietotājs bija aktīvs (pieslēgšanās, lapas ielāde). Atjaunina touch_user_last_seen.';

create index if not exists users_last_seen_idx on public.users (last_seen desc nulls last);

create or replace function public.touch_user_last_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_throttle interval := interval '2 minutes';
begin
  if v_uid is null then
    return;
  end if;

  update public.users u
  set
    last_seen = now(),
    updated_at = now()
  where u.id = v_uid
    and (
      u.last_seen is null
      or u.last_seen < now() - v_throttle
    );
end;
$$;

comment on function public.touch_user_last_seen() is
  'Atjauno public.users.last_seen pašreizējam auth.uid(); ne biežāk kā reizi 2 min.';

revoke all on function public.touch_user_last_seen() from public;
grant execute on function public.touch_user_last_seen() to authenticated;

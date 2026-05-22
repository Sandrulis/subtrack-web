-- Sesijā: ja pro_trial_started_at > created_at, iestata created_at (reģistrācija).
-- Palaid pēc 110_pro_trial_started_at_registration.sql (un 112 backfill, ja vēl nav).

create or replace function public.repair_pro_trial_started_at()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;

  update public.users u
  set
    pro_trial_started_at = u.created_at,
    updated_at = now()
  where u.id = v_uid
    and u.pro_trial_used = true
    and u.pro_trial_started_at is not null
    and u.created_at is not null
    and u.pro_trial_started_at > u.created_at + interval '5 minutes';

  return found;
end;
$$;

comment on function public.repair_pro_trial_started_at() is
  'SECURITY DEFINER: labo izmēģinājuma sākumu uz users.created_at, ja tas bija iestatīts pie pirmās pieslēgšanās.';

revoke all on function public.repair_pro_trial_started_at() from public;
revoke all on function public.repair_pro_trial_started_at() from anon;
grant execute on function public.repair_pro_trial_started_at() to authenticated;

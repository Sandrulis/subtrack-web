-- Security Advisor: Pro trial RPC – EXECUTE tikai service_role (ne authenticated).
-- Serveris izsauc ar SUPABASE_SERVICE_ROLE_KEY un p_user_id (skat. lib/auth/grant-pro-trial-session.ts).
-- Palaid pēc 110_pro_trial_started_at_registration.sql un 113_pro_trial_repair_started_at_rpc.sql.

drop function if exists public.grant_pro_trial_if_eligible();
drop function if exists public.repair_pro_trial_started_at();

create or replace function public.grant_pro_trial_if_eligible(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean := false;
  v_days integer := 0;
  v_created timestamptz;
begin
  if p_user_id is null then
    return false;
  end if;

  if exists (
    select 1
    from public.users u
    where u.id = p_user_id
      and (
        u.paid_plan_active
        or u.pro_vip
        or u.pro_trial_used
      )
  ) then
    return false;
  end if;

  select
    coalesce(s.paid_plan_enabled, false)
      and coalesce(s.pro_trial_enabled, false),
    greatest(coalesce(s.pro_trial_days, 0), 0)
    into v_ok, v_days
  from public.system_settings s
  where s.id = 1;

  if not v_ok or v_days < 1 then
    return false;
  end if;

  select u.created_at into v_created
  from public.users u
  where u.id = p_user_id;

  if v_created is null then
    v_created := now();
  end if;

  update public.users u
  set
    pro_trial_used = true,
    pro_trial_started_at = v_created,
    updated_at = now()
  where u.id = p_user_id
    and not u.paid_plan_active
    and not u.pro_vip
    and not u.pro_trial_used;

  return found;
end;
$$;

comment on function public.grant_pro_trial_if_eligible(uuid) is
  'SECURITY DEFINER: piešķir Pro izmēģinājumu; EXECUTE tikai service_role; p_user_id no servera sesijas.';

create or replace function public.repair_pro_trial_started_at(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return false;
  end if;

  update public.users u
  set
    pro_trial_started_at = u.created_at,
    updated_at = now()
  where u.id = p_user_id
    and u.pro_trial_used = true
    and u.pro_trial_started_at is not null
    and u.created_at is not null
    and u.pro_trial_started_at > u.created_at + interval '5 minutes';

  return found;
end;
$$;

comment on function public.repair_pro_trial_started_at(uuid) is
  'SECURITY DEFINER: labo izmēģinājuma sākumu; EXECUTE tikai service_role.';

revoke all on function public.grant_pro_trial_if_eligible(uuid) from public;
revoke all on function public.grant_pro_trial_if_eligible(uuid) from anon;
revoke all on function public.grant_pro_trial_if_eligible(uuid) from authenticated;
grant execute on function public.grant_pro_trial_if_eligible(uuid) to service_role;

revoke all on function public.repair_pro_trial_started_at(uuid) from public;
revoke all on function public.repair_pro_trial_started_at(uuid) from anon;
revoke all on function public.repair_pro_trial_started_at(uuid) from authenticated;
grant execute on function public.repair_pro_trial_started_at(uuid) to service_role;

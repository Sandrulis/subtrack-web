-- Piešķir Pro izmēģinājumu esošam lietotājam (vienu reizi), ja admin to ieslēdzis un konts vēl nav izmantojis.
-- Jaunie lietotāji joprojām saņem izmēģinājumu caur handle_new_user (107).
-- Palaid pēc 107_pro_trial.sql.

create or replace function public.grant_pro_trial_if_eligible()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ok boolean := false;
  v_days integer := 0;
begin
  if v_uid is null then
    return false;
  end if;

  if exists (
    select 1
    from public.users u
    where u.id = v_uid
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

  update public.users u
  set
    pro_trial_used = true,
    pro_trial_started_at = now(),
    updated_at = now()
  where u.id = v_uid
    and not u.paid_plan_active
    and not u.pro_vip
    and not u.pro_trial_used;

  return found;
end;
$$;

comment on function public.grant_pro_trial_if_eligible() is
  'SECURITY DEFINER: sesijas lietotājam piešķir Pro izmēģinājumu vienu reizi, ja ieslēgts maksas plāns + izmēģinājums.';

revoke all on function public.grant_pro_trial_if_eligible() from public;
revoke all on function public.grant_pro_trial_if_eligible() from anon;
grant execute on function public.grant_pro_trial_if_eligible() to authenticated;

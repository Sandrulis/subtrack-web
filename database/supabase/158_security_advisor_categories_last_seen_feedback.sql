-- Security Advisor: kategoriju / last_seen / feedback trigger un RPC.
-- Palaid pēc 157_site_translations_paid_plan_lifetime.sql (vai jaunākās migrācijas).
--
-- Leaked password protection: nav SQL; Supabase Dashboard:
--   Authentication → Providers → Email → Prevent use of leaked passwords
--   (Pro plānā; Free projektā Advisor brīdinājums var palikt – skat. README).

-- -----------------------------------------------------------------------------
-- 1) validate_subscription_category_ref – fiksēts search_path
-- -----------------------------------------------------------------------------
create or replace function public.validate_subscription_category_ref ()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  cat_exists boolean;
  cat_enabled boolean;
begin
  select
    true,
    sc.enabled
  into
    cat_exists,
    cat_enabled
  from public.subscription_categories sc
  where lower(sc.category_key) = lower(new.category)
  limit 1;

  if not coalesce(cat_exists, false) then
    raise exception 'invalid_subscription_category'
      using hint = 'category_key must exist in subscription_categories';
  end if;

  if tg_op = 'INSERT' or new.category is distinct from old.category then
    if not coalesce(cat_enabled, false) then
      raise exception 'disabled_subscription_category'
        using hint = 'category is disabled in subscription_categories';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.validate_subscription_category_ref () is
  'Pirms INSERT/UPDATE validē subscriptions.category pret subscription_categories (search_path = public).';

-- -----------------------------------------------------------------------------
-- 2) refresh_subscription_category_usage_counts – EXECUTE tikai service_role
-- -----------------------------------------------------------------------------
create or replace function public.refresh_subscription_category_usage_counts ()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscription_categories sc
  set
    usage_count = 0;

  update public.subscription_categories sc
  set
    usage_count = agg.cnt
  from
    (
      select
        lower(trim(s.category)) as cat_key,
        count(*)::bigint as cnt
      from public.subscriptions s
    group by
      1
    ) as agg
  where
    lower(sc.category_key) = agg.cat_key;
end;
$$;

comment on function public.refresh_subscription_category_usage_counts () is
  'Pārrēķina usage_count no subscriptions; EXECUTE tikai service_role (admin lapas serveris).';

revoke all on function public.refresh_subscription_category_usage_counts () from public;
revoke all on function public.refresh_subscription_category_usage_counts () from anon, authenticated;
grant execute on function public.refresh_subscription_category_usage_counts () to service_role;

-- -----------------------------------------------------------------------------
-- 3) usage_count sinhronizācija – trigeri, ne RPC no klienta
-- -----------------------------------------------------------------------------
create or replace function public.sync_subscription_category_usage_for_key (p_category text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  k text := lower(btrim(coalesce(p_category, '')));
  cnt bigint;
begin
  if k = '' then
    return;
  end if;

  select count(*)::bigint
  into cnt
  from public.subscriptions s
  where lower(btrim(s.category)) = k;

  update public.subscription_categories sc
  set usage_count = cnt
  where lower(sc.category_key) = k;
end;
$$;

comment on function public.sync_subscription_category_usage_for_key (text) is
  'Pārrēķina usage_count vienai kategorijai (SECURITY DEFINER; izsauc tikai trigeris).';

revoke all on function public.sync_subscription_category_usage_for_key (text) from public;
revoke all on function public.sync_subscription_category_usage_for_key (text) from anon, authenticated;

create or replace function public.subscriptions_sync_category_usage_trigger ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.sync_subscription_category_usage_for_key(old.category);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.sync_subscription_category_usage_for_key(new.category);
  end if;
  return coalesce(new, old);
end;
$$;

comment on function public.subscriptions_sync_category_usage_trigger () is
  'subscriptions AFTER trigger: atjauno usage_count (EXECUTE nav anon/authenticated).';

revoke all on function public.subscriptions_sync_category_usage_trigger () from public;
revoke all on function public.subscriptions_sync_category_usage_trigger () from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4) touch_user_last_seen – SECURITY INVOKER (RLS users_update_own)
-- -----------------------------------------------------------------------------
create or replace function public.touch_user_last_seen()
returns void
language plpgsql
security invoker
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
  'Atjauno public.users.last_seen pašreizējam auth.uid(); SECURITY INVOKER; ne biežāk kā reizi 2 min.';

revoke all on function public.touch_user_last_seen() from public;
grant execute on function public.touch_user_last_seen() to authenticated;

-- -----------------------------------------------------------------------------
-- 5) user_feedback_guard_landing_flag – trigeris, revoke EXECUTE
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

comment on function public.user_feedback_guard_landing_flag() is
  'Neļauj lietotājam mainīt approved_for_landing (SECURITY DEFINER trigeris; EXECUTE nav anon/authenticated).';

revoke all on function public.user_feedback_guard_landing_flag() from public;
revoke all on function public.user_feedback_guard_landing_flag() from anon, authenticated;

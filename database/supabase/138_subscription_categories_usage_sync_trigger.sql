-- Atjauno subscription_categories.usage_count automātiski, kad mainās subscriptions.
-- Palaid pēc 134_subscription_categories_usage_count.sql.

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
  'Pārrēķina usage_count vienai kategorijai no visiem subscriptions (SECURITY DEFINER).';

revoke all on function public.sync_subscription_category_usage_for_key (text) from public;
grant execute on function public.sync_subscription_category_usage_for_key (text) to authenticated;
grant execute on function public.sync_subscription_category_usage_for_key (text) to service_role;

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

drop trigger if exists subscriptions_sync_category_usage on public.subscriptions;
create trigger subscriptions_sync_category_usage
after insert or update of category or delete on public.subscriptions for each row
execute function public.subscriptions_sync_category_usage_trigger ();

-- Vienreizēja sinhronizācija
update public.subscription_categories sc
set
  usage_count = coalesce(agg.cnt, 0)
from
  (
    select
      lower(btrim(s.category)) as cat_key,
      count(*)::bigint as cnt
    from public.subscriptions s
    group by
      1
  ) as agg
where
  lower(sc.category_key) = agg.cat_key;

update public.subscription_categories sc
set
  usage_count = 0
where
  not exists (
    select
      1
    from public.subscriptions s
    where lower(btrim(s.category)) = lower(sc.category_key)
  );

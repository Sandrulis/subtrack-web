-- Kategoriju lietojuma skaits (visu lietotāju maksājumi) – kārtība panelī pēc popularitātes.
-- Palaid pēc 131_subscription_categories.sql.

alter table public.subscription_categories
add column if not exists usage_count bigint not null default 0;

comment on column public.subscription_categories.usage_count is
  'Denormalizēts: cik reizes `subscriptions.category` atbilst šai atslēgai (visi lietotāji). Atjauno `refresh_subscription_category_usage_counts()`.';

create index if not exists subscription_categories_usage_sort_idx on public.subscription_categories (
  usage_count desc,
  sort_order asc,
  category_key asc
);

-- Vienreizēja sākotnējā aizpilde
update public.subscription_categories sc
set
  usage_count = coalesce(agg.cnt, 0)
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

update public.subscription_categories sc
set
  usage_count = 0
where
  usage_count <> 0
  and not exists (
    select
      1
    from public.subscriptions s
    where lower(trim(s.category)) = lower(sc.category_key)
  );

create or replace function public.refresh_subscription_category_usage_counts ()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin () then
    raise exception 'admin_required';
  end if;

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
  'Pārrēķina usage_count no subscriptions; tikai admin (current_user_is_admin).';

revoke all on function public.refresh_subscription_category_usage_counts () from public;
grant execute on function public.refresh_subscription_category_usage_counts () to authenticated;

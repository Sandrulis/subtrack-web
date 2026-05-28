-- SubTrack: maksājumu kategorijas (`/admin/categories`) – dinamisks katalogs panelim un API.
-- Palaid pēc 001 (subscriptions) un `current_user_is_admin()`.
-- Noņem fiksēto CHECK uz `subscriptions.category`; validācija pret šo tabulu.

create table if not exists public.subscription_categories (
  id uuid primary key default gen_random_uuid (),
  category_key text not null,
  label text not null,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint subscription_categories_key_trim_chk check (
    category_key = btrim(category_key)
    and length(category_key) between 2 and 64
  ),
  constraint subscription_categories_key_fmt_chk check (
    category_key ~ '^[a-z][a-z0-9_]*$'
  ),
  constraint subscription_categories_label_trim_chk check (
    label = btrim(label) and char_length(label) between 1 and 160
  ),
  constraint subscription_categories_sort_chk check (sort_order >= 0)
);

comment on table public.subscription_categories is
  'Maksājumu/abonementu kategorijas – `category_key` glabājas `subscriptions.category`; `label` admin noklusējuma nosaukums.';

drop trigger if exists subscription_categories_set_updated_at on public.subscription_categories;
create trigger subscription_categories_set_updated_at
before update on public.subscription_categories for each row
execute function public.set_updated_at ();

drop index if exists subscription_categories_key_lower_uidx;
create unique index subscription_categories_key_lower_uidx on public.subscription_categories (lower (category_key));

create index if not exists subscription_categories_sort_idx on public.subscription_categories (sort_order, category_key);

alter table public.subscription_categories enable row level security;

drop policy if exists "subscription_categories_select_public" on public.subscription_categories;
create policy "subscription_categories_select_public" on public.subscription_categories for select using (true);

drop policy if exists "subscription_categories_insert_admin" on public.subscription_categories;
create policy "subscription_categories_insert_admin"
on public.subscription_categories for insert
with
  check (public.current_user_is_admin ());

drop policy if exists "subscription_categories_update_admin" on public.subscription_categories;
create policy "subscription_categories_update_admin"
on public.subscription_categories for update
using (public.current_user_is_admin ())
with
  check (public.current_user_is_admin ());

drop policy if exists "subscription_categories_delete_admin" on public.subscription_categories;
create policy "subscription_categories_delete_admin" on public.subscription_categories for delete using (
  public.current_user_is_admin ()
);

-- Sākotnējais katalogs (atbilst iepriekšējam CHECK)
insert into
  public.subscription_categories (category_key, label, sort_order, enabled)
select
  v.category_key,
  v.label,
  v.sort_order,
  true
from
  (
    values
      ('subscription', 'Abonements', 10),
      ('bill', 'Rēķins', 20),
      ('credit', 'Kredīts', 30),
      ('leasing', 'Līzings', 40),
      ('insurance', 'Apdrošināšana', 50),
      ('other', 'Citi maksājumi', 60)
  ) as v(category_key, label, sort_order)
where not exists (
  select
    1
  from public.subscription_categories c
  where lower(c.category_key) = lower(v.category_key)
);

-- Noņem fiksēto enum CHECK; validācija ar trigger
alter table public.subscriptions
drop constraint if exists subscriptions_category_chk;

create or replace function public.validate_subscription_category_ref ()
returns trigger
language plpgsql
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

drop trigger if exists subscriptions_validate_category on public.subscriptions;
create trigger subscriptions_validate_category
before insert or update of category on public.subscriptions for each row
execute function public.validate_subscription_category_ref ();

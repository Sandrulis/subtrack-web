-- Lifetime (vienreizēja) Pro opcija maksas plānam.
-- Palaid pēc database/supabase/155_win_back_emails.sql.

alter table public.system_settings
  add column if not exists paid_plan_lifetime_enabled boolean not null default false;

alter table public.system_settings
  add column if not exists paid_plan_lifetime_price_eur numeric(10, 2);

alter table public.system_settings
  add column if not exists paid_plan_lifetime_ends_at timestamptz;

alter table public.system_settings
  add column if not exists paid_plan_lifetime_purchase_limit integer;

alter table public.system_settings
  add column if not exists paid_plan_lifetime_purchase_count integer not null default 0;

comment on column public.system_settings.paid_plan_lifetime_enabled is
  'Ja true un paid_plan_enabled, rāda lifetime Pro opciju (cena: paid_plan_lifetime_price_eur).';

comment on column public.system_settings.paid_plan_lifetime_price_eur is
  'Lifetime Pro cena EUR. Rādās publiski tikai ar paid_plan_lifetime_enabled un derīgu vērtību.';

comment on column public.system_settings.paid_plan_lifetime_ends_at is
  'Laika limits lifetime piedāvājumam (UTC). NULL = bez laika limita.';

comment on column public.system_settings.paid_plan_lifetime_purchase_limit is
  'Maks. lifetime pirkumu skaits. NULL = bez iegādes limita.';

comment on column public.system_settings.paid_plan_lifetime_purchase_count is
  'Reģistrēto lifetime pirkumu skaits (checkout/RPC).';

alter table public.system_settings drop constraint if exists system_settings_paid_plan_lifetime_purchase_limit_check;

alter table public.system_settings
  add constraint system_settings_paid_plan_lifetime_purchase_limit_check
  check (
    paid_plan_lifetime_purchase_limit is null
    or (paid_plan_lifetime_purchase_limit >= 1 and paid_plan_lifetime_purchase_limit <= 1000000)
  );

alter table public.system_settings drop constraint if exists system_settings_paid_plan_lifetime_purchase_count_check;

alter table public.system_settings
  add constraint system_settings_paid_plan_lifetime_purchase_count_check
  check (
    paid_plan_lifetime_purchase_count >= 0
    and (
      paid_plan_lifetime_purchase_limit is null
      or paid_plan_lifetime_purchase_count <= paid_plan_lifetime_purchase_limit
    )
  );

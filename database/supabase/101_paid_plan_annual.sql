-- Gada norēķina opcija maksas plānam (tikai ja paid_plan_enabled).
-- Palaid pēc database/supabase/027_paid_plan.sql.

alter table public.system_settings
  add column if not exists paid_plan_annual_enabled boolean not null default false;

comment on column public.system_settings.paid_plan_annual_enabled is
  'Ja true un paid_plan_enabled, iespējots gada norēķins (cena: paid_plan_annual_price_eur).';

-- Gada cena EUR (admin ievada; atlaide % aprēķina kods pret 12× mēneša cenu).
-- Palaid pēc database/supabase/101_paid_plan_annual.sql.

alter table public.system_settings
  add column if not exists paid_plan_annual_price_eur numeric(10, 2);

comment on column public.system_settings.paid_plan_annual_price_eur is
  'Gada Pro cena EUR. Rādās publiski tikai ar paid_plan_annual_enabled un derīgu vērtību.';

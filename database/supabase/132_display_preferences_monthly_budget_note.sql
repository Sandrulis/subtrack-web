-- SubTrack: mēneša budžets glabājas `users.display_preferences` JSONB laukā (`monthly_budget`).
-- Jauna kolonna nav vajadzīga; esošā RLS un `display_preferences` atjaunināšana no Iestatījumiem jau strādā.

comment on column public.users.display_preferences is
  'JSONB: UI prefs (interface_language_code, currency, monthly_budget, datumu/laika formāti, TZ, nedēļas starts). Null = nav sinhronizēts.';

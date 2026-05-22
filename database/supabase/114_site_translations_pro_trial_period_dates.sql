-- Pro izmēģinājums: periods no–līdz blakus progress joslai
-- Palaid pēc 111_site_translations_pro_trial_end_date.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('trial.period_dates', 'lv', 'no {start} līdz {end}'),
  ('trial.period_dates', 'en', 'from {start} to {end}'),
  ('trial.period_dates', 'fr', 'du {start} au {end}'),
  ('trial.period_dates', 'de', 'vom {start} bis {end}'),
  ('trial.period_dates', 'es', 'del {start} al {end}'),
  ('trial.period_dates', 'pt', 'de {start} a {end}'),
  ('trial.period_dates', 'ru', 'с {start} по {end}')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

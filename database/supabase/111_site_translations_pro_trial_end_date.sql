-- Pro izmēģinājums: beigu datums blakus progress joslai
-- Palaid pēc 108_site_translations_pro_trial.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('trial.end_date', 'lv', 'līdz {date}'),
  ('trial.end_date', 'en', 'until {date}'),
  ('trial.end_date', 'fr', 'jusqu''au {date}'),
  ('trial.end_date', 'de', 'bis {date}'),
  ('trial.end_date', 'es', 'hasta el {date}'),
  ('trial.end_date', 'pt', 'até {date}'),
  ('trial.end_date', 'ru', 'до {date}')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

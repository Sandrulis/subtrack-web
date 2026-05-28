-- Landing Explore analītikas kartīte: īsā Pro birka (nevis "Pro lietotnē" u.tml.).
-- Palaid pēc 143_site_translations_landing_trust_highlights.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.explore.pro_in_app_badge', 'lv', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'en', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'fr', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'de', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'es', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'pt', 'Pro'),
  ('landing.explore.pro_in_app_badge', 'ru', 'Pro')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();

-- Apakšējās navigācijas īsais virsraksts „Sākums” (demo režīms).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('mobile.nav.home', 'lv', 'Sākums'),
  ('mobile.nav.home', 'en', 'Home'),
  ('mobile.nav.home', 'fr', 'Accueil'),
  ('mobile.nav.home', 'de', 'Start'),
  ('mobile.nav.home', 'es', 'Inicio'),
  ('mobile.nav.home', 'pt', 'Início'),
  ('mobile.nav.home', 'ru', 'Главная')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

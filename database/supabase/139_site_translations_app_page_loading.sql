-- Panelis: lapas ielādes indikators (spinner + teksts)
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('app.page_loading', 'lv', 'Ielādē…'),
  ('app.page_loading', 'en', 'Loading…'),
  ('app.page_loading', 'fr', 'Chargement…'),
  ('app.page_loading', 'de', 'Wird geladen…'),
  ('app.page_loading', 'es', 'Cargando…'),
  ('app.page_loading', 'pt', 'A carregar…'),
  ('app.page_loading', 'ru', 'Загрузка…')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

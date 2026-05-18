-- Demo paneļa ierīču parauga nosaukumi: lokāli tipiski vārdi (nevis fiksēti „Zane” / „Sandris”).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('demo.dashboard.device_watch_zane', 'lv', 'Apple Watch (Anna)'),
  ('demo.dashboard.device_watch_zane', 'en', 'Apple Watch (Emma)'),
  ('demo.dashboard.device_watch_zane', 'fr', 'Apple Watch (Emma)'),
  ('demo.dashboard.device_watch_zane', 'de', 'Apple Watch (Mia)'),
  ('demo.dashboard.device_watch_zane', 'es', 'Apple Watch (María)'),
  ('demo.dashboard.device_watch_zane', 'pt', 'Apple Watch (Maria)'),
  ('demo.dashboard.device_watch_zane', 'ru', 'Apple Watch (Анна)'),
  ('demo.dashboard.device_watch_sandris', 'lv', 'Apple Watch (Jānis)'),
  ('demo.dashboard.device_watch_sandris', 'en', 'Apple Watch (James)'),
  ('demo.dashboard.device_watch_sandris', 'fr', 'Apple Watch (Lucas)'),
  ('demo.dashboard.device_watch_sandris', 'de', 'Apple Watch (Leon)'),
  ('demo.dashboard.device_watch_sandris', 'es', 'Apple Watch (Carlos)'),
  ('demo.dashboard.device_watch_sandris', 'pt', 'Apple Watch (João)'),
  ('demo.dashboard.device_watch_sandris', 'ru', 'Apple Watch (Александр)')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;

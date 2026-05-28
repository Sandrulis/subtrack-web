-- Admin lietotāju saraksts: pēdējā aktivitāte zem reģistrācijas datuma.
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.users.last_seen', 'lv', 'Pēdējoreiz'),
  ('admin.users.last_seen', 'en', 'Last seen'),
  ('admin.users.last_seen', 'fr', 'Dernière visite'),
  ('admin.users.last_seen', 'de', 'Zuletzt gesehen'),
  ('admin.users.last_seen', 'es', 'Última visita'),
  ('admin.users.last_seen', 'pt', 'Última visita'),
  ('admin.users.last_seen', 'ru', 'Последний визит')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

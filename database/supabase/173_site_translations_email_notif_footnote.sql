-- E-pasta prefs: lietotājam redzams footnote bez Resend tehniskās piezīmes.
-- Palaid pēc 172_site_translations_analytics_empty.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('email.notifications.footnote', 'lv', 'Izmaiņas saglabājas automātiski.'),
  ('email.notifications.footnote', 'en', 'Changes save automatically.'),
  ('email.notifications.footnote', 'fr', 'Les modifications s''enregistrent automatiquement.'),
  ('email.notifications.footnote', 'de', 'Änderungen werden automatisch gespeichert.'),
  ('email.notifications.footnote', 'es', 'Los cambios se guardan automáticamente.'),
  ('email.notifications.footnote', 'pt', 'As alterações guardam-se automaticamente.'),
  ('email.notifications.footnote', 'ru', 'Изменения сохраняются автоматически.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

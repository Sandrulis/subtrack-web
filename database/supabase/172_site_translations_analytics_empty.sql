-- Analītika: tukšs stāvoklis (bez maksājumiem).
-- Palaid pēc 171_site_translations_account_deletion_reason.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.analytics.empty_no_data', 'lv', 'Nav ko parādīt — vēl nav pievienots neviens maksājums.'),
  ('fs.analytics.empty_no_data', 'en', 'Nothing to display yet. Add a payment to see your analytics here.'),
  ('fs.analytics.empty_no_data', 'fr', 'Rien à afficher pour le moment. Ajoutez un paiement pour voir vos statistiques.'),
  ('fs.analytics.empty_no_data', 'de', 'Noch nichts anzuzeigen. Fügen Sie eine Zahlung hinzu, um Analysen zu sehen.'),
  ('fs.analytics.empty_no_data', 'es', 'Aún no hay nada que mostrar. Añada un pago para ver sus estadísticas.'),
  ('fs.analytics.empty_no_data', 'pt', 'Ainda não há dados para mostrar. Adicione um pagamento para ver as estatísticas.'),
  ('fs.analytics.empty_no_data', 'ru', 'Пока нечего показать. Добавьте платёж, чтобы увидеть аналитику.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

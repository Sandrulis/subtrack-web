-- Panelis: tukšs abonementu saraksts (pelēks hints).
-- Palaid pēc 169_site_translations_settings_delete_account.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.empty_list_hint', 'lv', 'Vēl nav pievienots neviens maksājums.'),
  ('fs.dashboard.empty_list_hint', 'en', 'No payments added yet.'),
  ('fs.dashboard.empty_list_hint', 'fr', 'Aucun paiement ajouté pour le moment.'),
  ('fs.dashboard.empty_list_hint', 'de', 'Noch keine Zahlungen hinzugefügt.'),
  ('fs.dashboard.empty_list_hint', 'es', 'Aún no hay pagos añadidos.'),
  ('fs.dashboard.empty_list_hint', 'pt', 'Ainda não há pagamentos adicionados.'),
  ('fs.dashboard.empty_list_hint', 'ru', 'Платежи ещё не добавлены.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

-- Landing trust sadaļa: etiķete, kartīšu apakšteksti
-- Palaid pēc 142_site_translations_landing_family_combine_hint.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.trust.label', 'lv', 'Īsumā'),
  ('landing.trust.label', 'en', 'At a glance'),
  ('landing.trust.label', 'fr', 'En bref'),
  ('landing.trust.label', 'de', 'Auf einen Blick'),
  ('landing.trust.label', 'es', 'De un vistazo'),
  ('landing.trust.label', 'pt', 'Em resumo'),
  ('landing.trust.label', 'ru', 'Кратко'),

  ('landing.trust.payment_categories', 'lv', 'Maksājumu kategorijas'),
  ('landing.trust.payment_categories', 'en', 'Payment categories'),
  ('landing.trust.payment_categories', 'fr', 'Catégories de paiements'),
  ('landing.trust.payment_categories', 'de', 'Zahlungskategorien'),
  ('landing.trust.payment_categories', 'es', 'Categorías de pago'),
  ('landing.trust.payment_categories', 'pt', 'Categorias de pagamento'),
  ('landing.trust.payment_categories', 'ru', 'Категории платежей'),

  ('landing.trust.categories_hint', 'lv', 'Abonementi, rēķini, apdrošināšana un citi.'),
  ('landing.trust.categories_hint', 'en', 'Subscriptions, bills, insurance, and more.'),
  ('landing.trust.categories_hint', 'fr', 'Abonnements, factures, assurances et plus.'),
  ('landing.trust.categories_hint', 'de', 'Abos, Rechnungen, Versicherungen und mehr.'),
  ('landing.trust.categories_hint', 'es', 'Suscripciones, facturas, seguros y más.'),
  ('landing.trust.categories_hint', 'pt', 'Subscrições, faturas, seguros e mais.'),
  ('landing.trust.categories_hint', 'ru', 'Подписки, счета, страховки и другое.'),

  ('landing.trust.email_reminders_hint', 'lv', 'Pirms termiņa un par nokavētiem maksājumiem.'),
  ('landing.trust.email_reminders_hint', 'en', 'Before due dates and for overdue payments.'),
  ('landing.trust.email_reminders_hint', 'fr', 'Avant l''échéance et pour les paiements en retard.'),
  ('landing.trust.email_reminders_hint', 'de', 'Vor Fälligkeit und bei überfälligen Zahlungen.'),
  ('landing.trust.email_reminders_hint', 'es', 'Antes del vencimiento y por pagos atrasados.'),
  ('landing.trust.email_reminders_hint', 'pt', 'Antes do vencimento e por pagamentos em atraso.'),
  ('landing.trust.email_reminders_hint', 'ru', 'До срока и о просроченных платежах.')
ON CONFLICT (translation_key, locale) DO UPDATE
SET value = excluded.value, updated_at = now();

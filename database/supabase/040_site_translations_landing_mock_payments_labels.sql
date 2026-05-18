-- Mock paneļa statistika un saraksta virsraksts: „maksājumi” (`dashboard-fs-view`, `landing-page`).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.mock.stat_active_label', 'lv', 'Aktīvie maksājumi'),
  ('landing.mock.stat_active_label', 'en', 'Active payments'),
  ('landing.mock.stat_active_label', 'fr', 'Paiements actifs'),
  ('landing.mock.stat_active_label', 'de', 'Aktive Zahlungen'),
  ('landing.mock.stat_active_label', 'es', 'Pagos activos'),
  ('landing.mock.stat_active_label', 'pt', 'Pagamentos ativos'),
  ('landing.mock.stat_active_label', 'ru', 'Активные платежи'),
  ('landing.mock.subscription_list_heading', 'lv', 'Jūsu maksājumi'),
  ('landing.mock.subscription_list_heading', 'en', 'Your payments'),
  ('landing.mock.subscription_list_heading', 'fr', 'Vos paiements'),
  ('landing.mock.subscription_list_heading', 'de', 'Ihre Zahlungen'),
  ('landing.mock.subscription_list_heading', 'es', 'Tus pagos'),
  ('landing.mock.subscription_list_heading', 'pt', 'Seus pagamentos'),
  ('landing.mock.subscription_list_heading', 'ru', 'Ваши платежи')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;

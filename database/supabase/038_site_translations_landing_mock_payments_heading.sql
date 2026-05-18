-- Paneļa / hero virsraksts un apakšvirsraksts: „maksājumi”, ne tikai „abonementi”
-- (`landing.mock.subscriptions_*` – `dashboard-fs-view`, `landing-page`, `/demo/dashboard`).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('landing.mock.subscriptions_title', 'lv', 'Maksājumi'),
  ('landing.mock.subscriptions_title', 'en', 'Payments'),
  ('landing.mock.subscriptions_title', 'fr', 'Paiements'),
  ('landing.mock.subscriptions_title', 'de', 'Zahlungen'),
  ('landing.mock.subscriptions_title', 'es', 'Pagos'),
  ('landing.mock.subscriptions_title', 'pt', 'Pagamentos'),
  ('landing.mock.subscriptions_title', 'ru', 'Платежи'),
  (
    'landing.mock.subscriptions_subtitle',
    'lv',
    'Pārvaldiet savus ikmēneša maksājumus'
  ),
  (
    'landing.mock.subscriptions_subtitle',
    'en',
    'Manage your monthly payments'
  ),
  (
    'landing.mock.subscriptions_subtitle',
    'fr',
    'Gérez vos paiements mensuels'
  ),
  (
    'landing.mock.subscriptions_subtitle',
    'de',
    'Verwalten Sie Ihre monatlichen Zahlungen'
  ),
  (
    'landing.mock.subscriptions_subtitle',
    'es',
    'Gestiona tus pagos mensuales'
  ),
  (
    'landing.mock.subscriptions_subtitle',
    'pt',
    'Gerencie seus pagamentos mensais'
  ),
  (
    'landing.mock.subscriptions_subtitle',
    'ru',
    'Управляйте своими ежемесячными платежами'
  )
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;

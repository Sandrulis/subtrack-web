-- Sākumlapa: hero apakšvirsraksts ar {SYSTEM_NAME}; kājene bez „prototips”.
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  (
    'landing.hero.subtitle',
    'lv',
    '{SYSTEM_NAME} palīdz sekot Netflix, Spotify, kredītiem, apdrošināšanai un citiem periodiskajiem maksājumiem - vienā pārskatāmā panelī ar kalendāru, analītiku un atgādinājumiem.'
  ),
  (
    'landing.hero.subtitle',
    'en',
    '{SYSTEM_NAME} tracks Netflix, Spotify, loans, insurance, and other recurring payments in one focused dashboard - with calendar, analytics, and reminders.'
  ),
  (
    'landing.hero.subtitle',
    'fr',
    '{SYSTEM_NAME} suit Netflix, Spotify, les crédits, l’assurance et d’autres paiements récurrents dans un tableau de bord clair - avec calendrier, analyses et rappels.'
  ),
  (
    'landing.hero.subtitle',
    'de',
    '{SYSTEM_NAME} bündelt Netflix, Spotify, Kredite, Versicherungen und andere wiederkehrende Zahlungen in einem Überblick - mit Kalender, Analysen und Erinnerungen.'
  ),
  (
    'landing.hero.subtitle',
    'es',
    '{SYSTEM_NAME} reúne Netflix, Spotify, créditos, seguros y otros pagos recurrentes en un mismo panel claro: calendario, analíticas y recordatorios.'
  ),
  (
    'landing.hero.subtitle',
    'pt',
    'O {SYSTEM_NAME} acompanha Netflix, Spotify, créditos, seguros e outros pagamentos recorrentes num painel sóbrio - com calendário, análises e lembretes.'
  ),
  (
    'landing.hero.subtitle',
    'ru',
    '{SYSTEM_NAME} отслеживает Netflix, Spotify, кредиты, страховку и другие повторяющиеся платежи на одной специализированной панели — с календарем, аналитикой и напоминаниями.'
  ),

  ('landing.footer.byline', 'lv', 'abonementu un periodisko maksājumu pārvaldība.'),
  ('landing.footer.byline', 'en', 'subscription and recurring payment management.'),
  ('landing.footer.byline', 'fr', 'gestion des abonnements et des paiements récurrents.'),
  ('landing.footer.byline', 'de', 'Verwaltung von Abos und wiederkehrenden Zahlungen.'),
  ('landing.footer.byline', 'es', 'gestión de suscripciones y pagos periódicos.'),
  ('landing.footer.byline', 'pt', 'gestão de subscrições e pagamentos recorrentes.'),
  ('landing.footer.byline', 'ru', 'управление подписками и регулярными платежами.')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

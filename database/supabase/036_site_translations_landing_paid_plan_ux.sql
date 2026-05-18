-- Sākumlapas maksas plāna UX: Pro norādes analītikai, kalendāra piezīme, navigācijas tooltip.
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  (
    'landing.hero.calendar_mock_paid_note',
    'lv',
    'Kalendārs šeit ir ilustratīvs. Ja ieslēgts maksas plāns, pilna maksājumu kalendāra kolonna panelī ir Pro lietotājiem; brīvajā līmenī koncentrējies uz sarakstu un nākamajiem maksājumiem.'
  ),
  (
    'landing.hero.calendar_mock_paid_note',
    'en',
    'This calendar is illustrative. When a paid plan is on, the full payment calendar column in the app is for Pro users; on the free tier you still manage the list and upcoming charges.'
  ),
  (
    'landing.hero.calendar_mock_paid_note',
    'fr',
    'Ce calendrier est illustratif. Avec l''offre payante, la colonne calendrier complète dans l''app est réservée aux comptes Pro ; en accès gratuit, vous gardez liste et prochains paiements.'
  ),
  (
    'landing.hero.calendar_mock_paid_note',
    'de',
    'Dieser Kalender ist illustrativ. Mit kostenpflichtigem Plan ist die vollständige Kalenderspalte in der App für Pro-Nutzer; in der Gratis-Stufe stehen Liste und nächste Zahlungen im Fokus.'
  ),
  (
    'landing.hero.calendar_mock_paid_note',
    'es',
    'Este calendario es ilustrativo. Con el plan de pago, la columna completa del calendario en la app es para usuarios Pro; en el nivel gratuito gestionas la lista y los próximos cobros.'
  ),
  (
    'landing.hero.calendar_mock_paid_note',
    'pt',
    'Este calendário é ilustrativo. Com o plano pago, a coluna completa do calendário na app é para utilizadores Pro; no nível gratuito continua a gerir a lista e os próximos pagamentos.'
  ),
  (
    'landing.hero.calendar_mock_paid_note',
    'ru',
    'Этот календарь для примера. При платном плане полная колонка календаря в приложении - для Pro; на бесплатном уровне вы ведёте список и ближайшие платежи.'
  ),
  ('landing.explore.pro_in_app_badge', 'lv', 'Pro lietotnē'),
  ('landing.explore.pro_in_app_badge', 'en', 'Pro in app'),
  ('landing.explore.pro_in_app_badge', 'fr', 'Pro dans l''app'),
  ('landing.explore.pro_in_app_badge', 'de', 'Pro in der App'),
  ('landing.explore.pro_in_app_badge', 'es', 'Pro en la app'),
  ('landing.explore.pro_in_app_badge', 'pt', 'Pro na app'),
  ('landing.explore.pro_in_app_badge', 'ru', 'Pro в приложении'),
  (
    'landing.explore.analytics.pro_hint',
    'lv',
    'Pilnā analītika ielogotajā panelī pieejama ar Pro; zemāk vari atvērt tikai demonstrāciju ar parauga datiem.'
  ),
  (
    'landing.explore.analytics.pro_hint',
    'en',
    'Full analytics for logged-in users requires Pro; open the demo below for a sample preview.'
  ),
  (
    'landing.explore.analytics.pro_hint',
    'fr',
    'Les analyses complètes pour les comptes connectés nécessitent Pro; ouvrez la démo ci-dessous pour un aperçu d''exemple.'
  ),
  (
    'landing.explore.analytics.pro_hint',
    'de',
    'Volle Analysen für angemeldete Nutzer erfordern Pro; unten die Demo für eine Beispielvorschau.'
  ),
  (
    'landing.explore.analytics.pro_hint',
    'es',
    'El análisis completo en la cuenta requiere Pro; abre la demo abajo para ver un ejemplo.'
  ),
  (
    'landing.explore.analytics.pro_hint',
    'pt',
    'A análise completa na conta autenticada requer Pro; abra a demonstração abaixo para ver um exemplo.'
  ),
  (
    'landing.explore.analytics.pro_hint',
    'ru',
    'Полная аналитика для входа - только с Pro; ниже откройте демо с примерами.'
  ),
  (
    'nav.analytics_demo_hint',
    'lv',
    'Pilnā analītika lietotnē ir pieejama ar Pro; šī saite atver demonstrāciju.'
  ),
  (
    'nav.analytics_demo_hint',
    'en',
    'Full analytics in the app requires Pro; this link opens the demo preview.'
  ),
  (
    'nav.analytics_demo_hint',
    'fr',
    'Les analyses complètes dans l''app nécessitent Pro ; ce lien ouvre la démo.'
  ),
  (
    'nav.analytics_demo_hint',
    'de',
    'Volle Analysen in der App erfordern Pro; dieser Link öffnet die Demo.'
  ),
  (
    'nav.analytics_demo_hint',
    'es',
    'El análisis completo en la app requiere Pro; este enlace abre la demo.'
  ),
  (
    'nav.analytics_demo_hint',
    'pt',
    'A análise completa na app requer Pro; esta ligação abre a demonstração.'
  ),
  (
    'nav.analytics_demo_hint',
    'ru',
    'Полная аналитика в приложении - с Pro; ссылка открывает демо.'
  ),
  ('nav.pro_badge', 'lv', 'Pro'),
  ('nav.pro_badge', 'en', 'Pro'),
  ('nav.pro_badge', 'fr', 'Pro'),
  ('nav.pro_badge', 'de', 'Pro'),
  ('nav.pro_badge', 'es', 'Pro'),
  ('nav.pro_badge', 'pt', 'Pro'),
  ('nav.pro_badge', 'ru', 'Pro')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

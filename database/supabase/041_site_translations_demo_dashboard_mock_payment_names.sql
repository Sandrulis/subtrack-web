-- Demonstrācijas paneļa papildu parauga maksājumu nosaukumi (kavētie, šodien, nākamajā nedēļā).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('demo.dashboard.mock_od_streaming', 'lv', 'Straumēšanas pakalpojums'),
  ('demo.dashboard.mock_od_streaming', 'en', 'Streaming service'),
  ('demo.dashboard.mock_od_streaming', 'fr', 'Service de streaming'),
  ('demo.dashboard.mock_od_streaming', 'de', 'Streaming-Dienst'),
  ('demo.dashboard.mock_od_streaming', 'es', 'Servicio de streaming'),
  ('demo.dashboard.mock_od_streaming', 'pt', 'Serviço de streaming'),
  ('demo.dashboard.mock_od_streaming', 'ru', 'Стриминговый сервис'),
  ('demo.dashboard.mock_od_gym', 'lv', 'Sporta zāles abonements'),
  ('demo.dashboard.mock_od_gym', 'en', 'Gym membership'),
  ('demo.dashboard.mock_od_gym', 'fr', 'Abonnement salle de sport'),
  ('demo.dashboard.mock_od_gym', 'de', 'Fitness-Abo'),
  ('demo.dashboard.mock_od_gym', 'es', 'Gimnasio'),
  ('demo.dashboard.mock_od_gym', 'pt', 'Subscrição de ginásio'),
  ('demo.dashboard.mock_od_gym', 'ru', 'Абонемент в спортзал'),
  ('demo.dashboard.mock_today_meal', 'lv', 'Ēdienu komplekts'),
  ('demo.dashboard.mock_today_meal', 'en', 'Meal kit'),
  ('demo.dashboard.mock_today_meal', 'fr', 'Box repas'),
  ('demo.dashboard.mock_today_meal', 'de', 'Mahlzeiten-Box'),
  ('demo.dashboard.mock_today_meal', 'es', 'Caja de comidas'),
  ('demo.dashboard.mock_today_meal', 'pt', 'Kit de refeições'),
  ('demo.dashboard.mock_today_meal', 'ru', 'Набор блюд'),
  ('demo.dashboard.mock_week_bill', 'lv', 'Komunālais rēķins'),
  ('demo.dashboard.mock_week_bill', 'en', 'Utilities bill'),
  ('demo.dashboard.mock_week_bill', 'fr', 'Facture de charges'),
  ('demo.dashboard.mock_week_bill', 'de', 'Nebenkostenabrechnung'),
  ('demo.dashboard.mock_week_bill', 'es', 'Recibo de suministros'),
  ('demo.dashboard.mock_week_bill', 'pt', 'Conta de serviços'),
  ('demo.dashboard.mock_week_bill', 'ru', 'Счёт за коммунальные услуги')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value;

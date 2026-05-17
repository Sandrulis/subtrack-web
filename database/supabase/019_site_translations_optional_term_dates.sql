-- SubTrack: paneļa papildu opcijas – termiņa datumi kā patiesi neobligāti (apraksta teksts).
-- Palaid pēc `012`. Idempotenti.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.advanced_hint_credit', 'lv', 'Termiņa datumi nav obligāti. Ja norādi gan sākumu, gan beigas, sarakstā parādās progress josla.'),
  ('fs.dashboard.advanced_hint_credit', 'en', 'Term dates are optional. If you set both start and end, a payoff progress bar appears in the list.'),
  ('fs.dashboard.advanced_hint_credit', 'fr', 'Les dates de durée sont facultatives. Avec début et fin renseignés, une barre de progression s''affiche.'),
  ('fs.dashboard.advanced_hint_credit', 'de', 'Datumsfelder sind optional. Sind Start und Ende gesetzt, erscheint ein Fortschrittsbalken in der Liste.'),
  ('fs.dashboard.advanced_hint_credit', 'es', 'Las fechas son opcionales. Si indicas inicio y fin, verás una barra de progreso en la lista.'),
  ('fs.dashboard.advanced_hint_credit', 'pt', 'As datas são opcionais. Ao definir início e fim, surge uma barra de progresso na lista.'),
  ('fs.dashboard.advanced_hint_credit', 'ru', 'Даты срока необязательны. Если указать начало и конец, в списке появится индикатор прогресса.')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

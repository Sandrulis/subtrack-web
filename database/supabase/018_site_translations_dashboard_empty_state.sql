-- SubTrack: paneļa tukšā stāvokļa lead teksts (īsāks).
-- Noņem `empty_secondary` ierakstus DB (UI vairs nerāda – neturpina ar tukšām virknēm kā „tulkojumu”).
-- Palaid pēc `011` / `012`. Idempotenti.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('fs.dashboard.empty_lead', 'lv', 'Šeit būs regulārie maksājumi un abonamenti.'),
  ('fs.dashboard.empty_lead', 'en', 'Regular payments and subscriptions will appear here.'),
  ('fs.dashboard.empty_lead', 'fr', 'Les paiements réguliers et les abonnements apparaîtront ici.'),
  ('fs.dashboard.empty_lead', 'de', 'Hier erscheinen wiederkehrende Zahlungen und Abonnements.'),
  ('fs.dashboard.empty_lead', 'es', 'Aquí aparecerán pagos recurrentes y suscripciones.'),
  ('fs.dashboard.empty_lead', 'pt', 'Pagamentos regulares e subscrições aparecerão aqui.'),
  ('fs.dashboard.empty_lead', 'ru', 'Здесь будут регулярные платежи и подписки.')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

DELETE FROM public.site_translations
WHERE translation_key = 'fs.dashboard.empty_secondary';

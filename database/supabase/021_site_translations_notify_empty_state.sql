-- SubTrack: paziņojumu paneļa tukšais stāvoklis (kad nav kavēto / gaidāmo 7 dienu logā).

-- Palaid pēc `012`. Idempotenti.

-- `session.notify_empty_hint` vairs netiek lietots – dzēš vecos ierakstus (sk. projekta noteikumus par tukšām virknēm).



INSERT INTO public.site_translations (translation_key, locale, value)

VALUES

  ('session.notify_empty_lead', 'lv', 'Šobrīd nav aktīvu paziņojumu.'),

  ('session.notify_empty_lead', 'en', 'You''re all caught up.'),

  ('session.notify_empty_lead', 'fr', 'Vous êtes à jour.'),

  ('session.notify_empty_lead', 'de', 'Sie sind auf dem neuesten Stand.'),

  ('session.notify_empty_lead', 'es', 'Todo al día por aquí.'),

  ('session.notify_empty_lead', 'pt', 'Está em dia.'),

  ('session.notify_empty_lead', 'ru', 'На данный момент уведомлений нет.')

ON CONFLICT (translation_key, locale)

DO UPDATE SET

  value = excluded.value,

  updated_at = now();



DELETE FROM public.site_translations

WHERE translation_key = 'session.notify_empty_hint';



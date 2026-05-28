-- Admin: relatīvais last_seen (šodien min/s; līdz 30 d. – dienas).
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.users.last_seen_ago_today', 'lv', 'pirms {minutes} min {seconds} s'),
  ('admin.users.last_seen_ago_today', 'en', '{minutes} min {seconds} s ago'),
  ('admin.users.last_seen_ago_today', 'fr', 'il y a {minutes} min {seconds} s'),
  ('admin.users.last_seen_ago_today', 'de', 'vor {minutes} Min. {seconds} s'),
  ('admin.users.last_seen_ago_today', 'es', 'hace {minutes} min {seconds} s'),
  ('admin.users.last_seen_ago_today', 'pt', 'há {minutes} min {seconds} s'),
  ('admin.users.last_seen_ago_today', 'ru', '{minutes} мин {seconds} с назад'),
  ('admin.users.last_seen_one_day', 'lv', 'nav redzēts 1 dienu'),
  ('admin.users.last_seen_one_day', 'en', 'not seen for 1 day'),
  ('admin.users.last_seen_one_day', 'fr', 'absent 1 jour'),
  ('admin.users.last_seen_one_day', 'de', 'seit 1 Tag nicht gesehen'),
  ('admin.users.last_seen_one_day', 'es', 'no visto en 1 día'),
  ('admin.users.last_seen_one_day', 'pt', 'não visto há 1 dia'),
  ('admin.users.last_seen_one_day', 'ru', 'не был(а) 1 день'),
  ('admin.users.last_seen_days', 'lv', 'nav redzēts {days} dienas'),
  ('admin.users.last_seen_days', 'en', 'not seen for {days} days'),
  ('admin.users.last_seen_days', 'fr', 'absent {days} jours'),
  ('admin.users.last_seen_days', 'de', 'seit {days} Tagen nicht gesehen'),
  ('admin.users.last_seen_days', 'es', 'no visto en {days} días'),
  ('admin.users.last_seen_days', 'pt', 'não visto há {days} dias'),
  ('admin.users.last_seen_days', 'ru', 'не был(а) {days} дн.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

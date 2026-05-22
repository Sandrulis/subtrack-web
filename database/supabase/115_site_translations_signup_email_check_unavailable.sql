-- Reģistrācija: e-pasta pārbaude nav pieejama (rate limit / serveris)
-- Palaid pēc 114_site_translations_pro_trial_period_dates.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('auth.signup.email_check_unavailable', 'lv', 'E-pasta pārbaude īslaicīgi nav pieejama. Mēģini vēlreiz pēc brīža.'),
  ('auth.signup.email_check_unavailable', 'en', 'Email check is temporarily unavailable. Try again in a moment.'),
  ('auth.signup.email_check_unavailable', 'fr', 'La vérification de l''e-mail est temporairement indisponible. Réessayez dans un instant.'),
  ('auth.signup.email_check_unavailable', 'de', 'E-Mail-Prüfung vorübergehend nicht verfügbar. Bitte gleich erneut versuchen.'),
  ('auth.signup.email_check_unavailable', 'es', 'La comprobación del correo no está disponible. Inténtalo de nuevo en un momento.'),
  ('auth.signup.email_check_unavailable', 'pt', 'A verificação do email está indisponível. Tente novamente dentro de instantes.'),
  ('auth.signup.email_check_unavailable', 'ru', 'Проверка email временно недоступна. Повторите попытку через минуту.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

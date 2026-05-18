-- SubTrack: pieteikšanās / reģistrācija / aizmirstā parole - iesniegšanas statusi.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('auth.status.login_pending', 'lv', 'Ielogojam…'),
  ('auth.status.login_pending', 'en', 'Signing in…'),
  ('auth.status.login_pending', 'fr', 'Connexion…'),
  ('auth.status.login_pending', 'de', 'Anmeldung…'),
  ('auth.status.login_pending', 'es', 'Entrando…'),
  ('auth.status.login_pending', 'pt', 'A entrar…'),
  ('auth.status.login_pending', 'ru', 'Вход…'),

  ('auth.status.login_detail', 'lv', 'Pārbaudām e-pastu un paroli. Uz brīdi pacieties.'),
  ('auth.status.login_detail', 'en', 'Checking your email and password. This may take a moment.'),
  ('auth.status.login_detail', 'fr', 'Vérification de l’e-mail et du mot de passe. Patientez un instant.'),
  ('auth.status.login_detail', 'de', 'E-Mail und Passwort werden geprüft. Bitte kurz warten.'),
  ('auth.status.login_detail', 'es', 'Comprobando tu correo y contraseña. Espera un momento.'),
  ('auth.status.login_detail', 'pt', 'A verificar o e-mail e a palavra-passe. Aguarde um momento.'),
  ('auth.status.login_detail', 'ru', 'Проверяем e-mail и пароль. Подождите немного.'),

  ('auth.status.signup_pending', 'lv', 'Reģistrējam…'),
  ('auth.status.signup_pending', 'en', 'Creating account…'),
  ('auth.status.signup_pending', 'fr', 'Création du compte…'),
  ('auth.status.signup_pending', 'de', 'Konto wird erstellt…'),
  ('auth.status.signup_pending', 'es', 'Creando cuenta…'),
  ('auth.status.signup_pending', 'pt', 'A criar conta…'),
  ('auth.status.signup_pending', 'ru', 'Регистрация…'),

  ('auth.status.signup_detail', 'lv', 'Izveidojam kontu un sagatavojam pieteikšanos. Uz brīdi pacieties.'),
  ('auth.status.signup_detail', 'en', 'Setting up your account. This may take a moment.'),
  ('auth.status.signup_detail', 'fr', 'Configuration de votre compte. Patientez un instant.'),
  ('auth.status.signup_detail', 'de', 'Ihr Konto wird eingerichtet. Bitte kurz warten.'),
  ('auth.status.signup_detail', 'es', 'Configurando tu cuenta. Espera un momento.'),
  ('auth.status.signup_detail', 'pt', 'A configurar a sua conta. Aguarde um momento.'),
  ('auth.status.signup_detail', 'ru', 'Создаём учётную запись. Подождите немного.'),

  ('auth.status.forgot_pending', 'lv', 'Nosūtām…'),
  ('auth.status.forgot_pending', 'en', 'Sending…'),
  ('auth.status.forgot_pending', 'fr', 'Envoi…'),
  ('auth.status.forgot_pending', 'de', 'Wird gesendet…'),
  ('auth.status.forgot_pending', 'es', 'Enviando…'),
  ('auth.status.forgot_pending', 'pt', 'A enviar…'),
  ('auth.status.forgot_pending', 'ru', 'Отправка…'),

  ('auth.status.forgot_detail', 'lv', 'Gatavojam paroles atjaunošanas saiti. Uz brīdi pacieties.'),
  ('auth.status.forgot_detail', 'en', 'Preparing your password reset link. This may take a moment.'),
  ('auth.status.forgot_detail', 'fr', 'Préparation du lien de réinitialisation. Patientez un instant.'),
  ('auth.status.forgot_detail', 'de', 'Der Link zum Zurücksetzen wird vorbereitet. Bitte kurz warten.'),
  ('auth.status.forgot_detail', 'es', 'Preparando el enlace para restablecer la contraseña. Espera un momento.'),
  ('auth.status.forgot_detail', 'pt', 'A preparar o link de reposição da palavra-passe. Aguarde um momento.'),
  ('auth.status.forgot_detail', 'ru', 'Готовим ссылку для сброса пароля. Подождите немного.')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

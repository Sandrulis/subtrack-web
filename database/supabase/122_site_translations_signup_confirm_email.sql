-- Reģistrācija: ekrāns „Pārbaudiet e-pastu” pēc veiksmīgas reģistrācijas.
-- Palaid pēc 121_site_translations_reset_password_recovery_ui.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('auth.signup.confirm_email.heading', 'lv', 'Pārbaudiet e-pastu'),
  ('auth.signup.confirm_email.heading', 'en', 'Check your email'),
  ('auth.signup.confirm_email.heading', 'fr', 'Vérifiez votre e-mail'),
  ('auth.signup.confirm_email.heading', 'de', 'E-Mail prüfen'),
  ('auth.signup.confirm_email.heading', 'es', 'Revisa tu correo'),
  ('auth.signup.confirm_email.heading', 'pt', 'Verifique o email'),
  ('auth.signup.confirm_email.heading', 'ru', 'Проверьте почту'),
  ('auth.signup.confirm_email.lead', 'lv', 'Nosūtījām apstiprinājuma saiti. Atver e-pastu un apstiprini profilu, lai varētu pieteikties.'),
  ('auth.signup.confirm_email.lead', 'en', 'We sent a confirmation link. Open your email and confirm your profile to sign in.'),
  ('auth.signup.confirm_email.lead', 'fr', 'Nous avons envoyé un lien de confirmation. Ouvrez l''e-mail et confirmez votre profil.'),
  ('auth.signup.confirm_email.lead', 'de', 'Wir haben einen Bestätigungslink gesendet. Öffnen Sie die E-Mail und bestätigen Sie Ihr Profil.'),
  ('auth.signup.confirm_email.lead', 'es', 'Enviamos un enlace de confirmación. Abre el correo y confirma tu perfil.'),
  ('auth.signup.confirm_email.lead', 'pt', 'Enviámos uma ligação de confirmação. Abra o email e confirme o perfil.'),
  ('auth.signup.confirm_email.lead', 'ru', 'Мы отправили ссылку. Откройте письмо и подтвердите профиль.'),
  ('auth.signup.confirm_email.back_login', 'lv', 'Atpakaļ uz pieteikšanos'),
  ('auth.signup.confirm_email.back_login', 'en', 'Back to sign in'),
  ('auth.signup.confirm_email.back_login', 'fr', 'Retour à la connexion'),
  ('auth.signup.confirm_email.back_login', 'de', 'Zur Anmeldung'),
  ('auth.signup.confirm_email.back_login', 'es', 'Volver al inicio de sesión'),
  ('auth.signup.confirm_email.back_login', 'pt', 'Voltar ao início de sessão'),
  ('auth.signup.confirm_email.back_login', 'ru', 'К входу'),
  ('auth.signup.confirm_email.spam_hint', 'lv', 'Nesaņēmāt e-pastu? Pārbaudiet surogātpastu vai'),
  ('auth.signup.confirm_email.spam_hint', 'en', 'Didn''t get the email? Check spam or'),
  ('auth.signup.confirm_email.spam_hint', 'fr', 'Pas reçu l''e-mail ? Vérifiez les spams ou'),
  ('auth.signup.confirm_email.spam_hint', 'de', 'Keine E-Mail? Spam prüfen oder'),
  ('auth.signup.confirm_email.spam_hint', 'es', '¿No llegó? Revisa spam o'),
  ('auth.signup.confirm_email.spam_hint', 'pt', 'Não recebeu? Verifique spam ou'),
  ('auth.signup.confirm_email.spam_hint', 'ru', 'Нет письма? Проверьте спам или'),
  ('auth.signup.confirm_email.try_again', 'lv', 'reģistrējieties vēlreiz'),
  ('auth.signup.confirm_email.try_again', 'en', 'try signing up again'),
  ('auth.signup.confirm_email.try_again', 'fr', 'réessayez l''inscription'),
  ('auth.signup.confirm_email.try_again', 'de', 'erneut registrieren'),
  ('auth.signup.confirm_email.try_again', 'es', 'regístrese de nuevo'),
  ('auth.signup.confirm_email.try_again', 'pt', 'registe-se novamente'),
  ('auth.signup.confirm_email.try_again', 'ru', 'зарегистрируйтесь снова')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

-- Tulkošanas atslēgas: admin reģistrācijas slēdzis + viesu ziņojums.
-- Palaid pēc 166_system_settings_signup_enabled.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.forms.section_signup', 'lv', 'Jaunu lietotāju reģistrācija'),
  ('admin.forms.section_signup', 'en', 'New user registration'),
  ('admin.forms.section_signup', 'fr', 'Inscription de nouveaux utilisateurs'),
  ('admin.forms.section_signup', 'de', 'Registrierung neuer Nutzer'),
  ('admin.forms.section_signup', 'es', 'Registro de nuevos usuarios'),
  ('admin.forms.section_signup', 'pt', 'Registo de novos utilizadores'),
  ('admin.forms.section_signup', 'ru', 'Регистрация новых пользователей'),
  ('admin.forms.signup_enable', 'lv', 'Atļaut jaunu lietotāju reģistrāciju'),
  ('admin.forms.signup_enable', 'en', 'Allow new user registration'),
  ('admin.forms.signup_enable', 'fr', 'Autoriser l’inscription de nouveaux utilisateurs'),
  ('admin.forms.signup_enable', 'de', 'Registrierung neuer Nutzer erlauben'),
  ('admin.forms.signup_enable', 'es', 'Permitir registro de nuevos usuarios'),
  ('admin.forms.signup_enable', 'pt', 'Permitir registo de novos utilizadores'),
  ('admin.forms.signup_enable', 'ru', 'Разрешить регистрацию новых пользователей'),
  ('admin.forms.signup_enable_hint', 'lv', 'Izslēdzot, /signup novirza uz pieteikšanos un augšējā joslā pazūd reģistrācijas poga.'),
  ('admin.forms.signup_enable_hint', 'en', 'When off, /signup redirects to sign-in and the registration button is hidden in the top bar.'),
  ('admin.forms.signup_enable_hint', 'fr', 'Désactivé : /signup redirige vers la connexion et le bouton d’inscription disparaît de la barre.'),
  ('admin.forms.signup_enable_hint', 'de', 'Aus: /signup leitet zur Anmeldung um; Registrierungs-Button in der Leiste ausgeblendet.'),
  ('admin.forms.signup_enable_hint', 'es', 'Desactivado: /signup redirige al inicio de sesión y se oculta el botón de registro.'),
  ('admin.forms.signup_enable_hint', 'pt', 'Desligado: /signup redireciona para entrar e o botão de registo some da barra.'),
  ('admin.forms.signup_enable_hint', 'ru', 'Выкл.: /signup перенаправляет на вход, кнопка регистрации скрыта.'),
  ('auth.signup.disabled', 'lv', 'Jaunu kontu reģistrācija pašlaik nav pieejama.'),
  ('auth.signup.disabled', 'en', 'New account registration is currently unavailable.'),
  ('auth.signup.disabled', 'fr', 'L’inscription de nouveaux comptes n’est pas disponible pour le moment.'),
  ('auth.signup.disabled', 'de', 'Die Registrierung neuer Konten ist derzeit nicht verfügbar.'),
  ('auth.signup.disabled', 'es', 'El registro de nuevas cuentas no está disponible en este momento.'),
  ('auth.signup.disabled', 'pt', 'O registo de novas contas não está disponível de momento.'),
  ('auth.signup.disabled', 'ru', 'Регистрация новых учётных записей сейчас недоступна.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

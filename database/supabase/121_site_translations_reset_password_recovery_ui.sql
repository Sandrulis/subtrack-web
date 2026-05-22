-- Aizmirstā parole: forma bez pašreizējās paroles (recovery=1).
-- Palaid pēc 120_retired_signup_emails_security_advisor.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('auth.reset_password.heading', 'lv', 'Jauna parole'),
  ('auth.reset_password.heading', 'en', 'New password'),
  ('auth.reset_password.heading', 'fr', 'Nouveau mot de passe'),
  ('auth.reset_password.heading', 'de', 'Neues Passwort'),
  ('auth.reset_password.heading', 'es', 'Nueva contraseña'),
  ('auth.reset_password.heading', 'pt', 'Nova palavra-passe'),
  ('auth.reset_password.heading', 'ru', 'Новый пароль'),
  ('auth.reset_password.intro', 'lv', 'Izvēlies jaunu paroli (vismaz 8 rakstzīmes). Pašreizējo paroli neprasa – tu to aizmirsi.'),
  ('auth.reset_password.intro', 'en', 'Choose a new password (at least 8 characters). You do not need your current one.'),
  ('auth.reset_password.intro', 'fr', 'Choisissez un nouveau mot de passe (8 caractères min.). L''ancien n''est pas requis.'),
  ('auth.reset_password.intro', 'de', 'Neues Passwort wählen (mind. 8 Zeichen). Das alte ist nicht nötig.'),
  ('auth.reset_password.intro', 'es', 'Elige una nueva contraseña (mín. 8). No necesitas la actual.'),
  ('auth.reset_password.intro', 'pt', 'Escolha uma nova palavra-passe (mín. 8). A atual não é necessária.'),
  ('auth.reset_password.intro', 'ru', 'Задайте новый пароль (не менее 8 символов). Старый не нужен.'),
  ('auth.reset_password.submit', 'lv', 'Saglabāt jauno paroli'),
  ('auth.reset_password.submit', 'en', 'Save new password'),
  ('auth.reset_password.submit', 'fr', 'Enregistrer'),
  ('auth.reset_password.submit', 'de', 'Speichern'),
  ('auth.reset_password.submit', 'es', 'Guardar'),
  ('auth.reset_password.submit', 'pt', 'Guardar'),
  ('auth.reset_password.submit', 'ru', 'Сохранить'),
  ('auth.reset_password.back_login', 'lv', 'Atpakaļ uz pieteikšanos'),
  ('auth.reset_password.back_login', 'en', 'Back to sign in'),
  ('auth.reset_password.back_login', 'fr', 'Retour à la connexion'),
  ('auth.reset_password.back_login', 'de', 'Zur Anmeldung'),
  ('auth.reset_password.back_login', 'es', 'Volver al inicio de sesión'),
  ('auth.reset_password.back_login', 'pt', 'Voltar ao início de sessão'),
  ('auth.reset_password.back_login', 'ru', 'К входу')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

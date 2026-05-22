-- OAuth: viens konts (e-pasts + parole un Google) – login norāde un iestatījumu sadaļa
-- Palaid pēc 025_* / 125_*.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('auth.social.same_account_hint', 'lv', 'Ja reģistrējies ar e-pastu un paroli, izmanto to pašu Gmail Google kontā. Pēc e-pasta apstiprināšanas vari ieiet arī ar Google.'),
  ('auth.social.same_account_hint', 'en', 'If you signed up with email and password, use the same Gmail in Google. After confirming your email, you can also sign in with Google.'),
  ('auth.social.same_account_hint', 'fr', 'Si vous vous êtes inscrit par e-mail et mot de passe, utilisez le même Gmail. Après confirmation, vous pouvez aussi vous connecter avec Google.'),
  ('auth.social.same_account_hint', 'de', 'Wenn Sie sich mit E-Mail und Passwort registriert haben, nutzen Sie dasselbe Gmail-Konto. Nach der Bestätigung können Sie sich auch mit Google anmelden.'),
  ('auth.social.same_account_hint', 'es', 'Si te registraste con correo y contraseña, usa el mismo Gmail. Tras confirmar el correo, también puedes entrar con Google.'),
  ('auth.social.same_account_hint', 'pt', 'Se registou com e-mail e palavra-passe, use o mesmo Gmail. Após confirmar o e-mail, também pode entrar com Google.'),
  ('auth.social.same_account_hint', 'ru', 'Если вы регистрировались по e-mail и паролю, используйте тот же Gmail. После подтверждения почты можно входить через Google.'),
  ('settings.google_connect.title', 'lv', 'Google pieteikšanās'),
  ('settings.google_connect.title', 'en', 'Google sign-in'),
  ('settings.google_connect.title', 'fr', 'Connexion Google'),
  ('settings.google_connect.title', 'de', 'Google-Anmeldung'),
  ('settings.google_connect.title', 'es', 'Inicio con Google'),
  ('settings.google_connect.title', 'pt', 'Entrada com Google'),
  ('settings.google_connect.title', 'ru', 'Вход через Google'),
  ('settings.google_connect.lead', 'lv', 'Piesaisti Google šim kontam, lai nākotnē varētu ieiet ar Google pogu (tas pats e-pasts).'),
  ('settings.google_connect.lead', 'en', 'Link Google to this account so you can sign in with the Google button later (same email).'),
  ('settings.google_connect.lead', 'fr', 'Associez Google à ce compte pour vous connecter plus tard avec le bouton Google (même e-mail).'),
  ('settings.google_connect.lead', 'de', 'Google mit diesem Konto verknüpfen, um sich später mit der Google-Schaltfläche anzumelden (gleiche E-Mail).'),
  ('settings.google_connect.lead', 'es', 'Vincula Google a esta cuenta para entrar después con el botón Google (mismo correo).'),
  ('settings.google_connect.lead', 'pt', 'Associe o Google a esta conta para entrar depois com o botão Google (mesmo e-mail).'),
  ('settings.google_connect.lead', 'ru', 'Привяжите Google к этому аккаунту, чтобы входить кнопкой Google (тот же e-mail).'),
  ('settings.google_connect.btn', 'lv', 'Savienot ar Google'),
  ('settings.google_connect.btn', 'en', 'Connect Google'),
  ('settings.google_connect.btn', 'fr', 'Associer Google'),
  ('settings.google_connect.btn', 'de', 'Mit Google verbinden'),
  ('settings.google_connect.btn', 'es', 'Conectar Google'),
  ('settings.google_connect.btn', 'pt', 'Ligar Google'),
  ('settings.google_connect.btn', 'ru', 'Подключить Google'),
  ('settings.google_connect.linked', 'lv', 'Google ir piesaistīts šim kontam. Vari ieiet ar Google pogu.'),
  ('settings.google_connect.linked', 'en', 'Google is linked to this account. You can sign in with the Google button.'),
  ('settings.google_connect.linked', 'fr', 'Google est associé à ce compte. Vous pouvez vous connecter avec Google.'),
  ('settings.google_connect.linked', 'de', 'Google ist mit diesem Konto verknüpft. Sie können sich mit Google anmelden.'),
  ('settings.google_connect.linked', 'es', 'Google está vinculado a esta cuenta. Puedes entrar con Google.'),
  ('settings.google_connect.linked', 'pt', 'O Google está associado a esta conta. Pode entrar com Google.'),
  ('settings.google_connect.linked', 'ru', 'Google привязан к этому аккаунту. Можно входить через Google.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

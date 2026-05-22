-- Aizmirstā parole: reset_password caur Resend + /admin/email-design.
-- Palaid pēc 117_site_translations_signup_email_via_resend.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.email_design.resend_hint', 'lv', 'Ar RESEND_API_KEY un EMAIL_FROM: reģistrācija un aizmirstā parole no šī dizaina (UI valoda) + kavētie maksājumi (cron). Bez atslēgām Auth e-pastus sūta Supabase.'),
  ('admin.email_design.resend_hint', 'en', 'With RESEND_API_KEY and EMAIL_FROM: signup and password reset from this design (UI language) and overdue payments (cron). Without keys, Auth uses Supabase.'),
  ('admin.email_design.resend_hint', 'fr', 'Avec RESEND_API_KEY et EMAIL_FROM : inscription et mot de passe oublié depuis ce modèle (langue UI) et paiements en retard (cron). Sinon Auth via Supabase.'),
  ('admin.email_design.resend_hint', 'de', 'Mit RESEND_API_KEY und EMAIL_FROM: Registrierung und Passwort vergessen aus diesem Design (UI-Sprache) und überfällige Zahlungen (Cron). Ohne Schlüssel: Supabase Auth.'),
  ('admin.email_design.resend_hint', 'es', 'Con RESEND_API_KEY y EMAIL_FROM: registro y contraseña olvidada desde este diseño (idioma UI) y pagos vencidos (cron). Sin claves, Auth usa Supabase.'),
  ('admin.email_design.resend_hint', 'pt', 'Com RESEND_API_KEY e EMAIL_FROM: registo e palavra-passe esquecida deste design (idioma UI) e pagamentos em atraso (cron). Sem chaves, Auth usa Supabase.'),
  ('admin.email_design.resend_hint', 'ru', 'С RESEND_API_KEY и EMAIL_FROM: регистрация и сброс пароля из шаблона (язык UI) и просрочка (cron). Без ключей Auth через Supabase.'),
  ('admin.email_design.editor_hint_auth', 'lv', 'Reģistrācija un aizmirstā parole: ar RESEND + SERVICE_ROLE e-pastu sūta aplikācija. Pārējie Auth veidi – Supabase šabloni („Kopēt Supabase”).'),
  ('admin.email_design.editor_hint_auth', 'en', 'Signup and forgot password: with RESEND + SERVICE_ROLE the app sends mail from saved copy. Other Auth types – Supabase templates („Copy for Supabase”).'),
  ('admin.email_design.editor_hint_auth', 'fr', 'Inscription et mot de passe oublié : avec RESEND + SERVICE_ROLE l''app envoie l''e-mail. Autres Auth – modèles Supabase (« Copier pour Supabase »).'),
  ('admin.email_design.editor_hint_auth', 'de', 'Registrierung und Passwort vergessen: mit RESEND + SERVICE_ROLE sendet die App. Andere Auth – Supabase-Vorlagen („Für Supabase kopieren“).'),
  ('admin.email_design.editor_hint_auth', 'es', 'Registro y contraseña olvidada: con RESEND + SERVICE_ROLE la app envía el correo. Otros Auth – plantillas Supabase («Copiar para Supabase»).'),
  ('admin.email_design.editor_hint_auth', 'pt', 'Registo e palavra-passe esquecida: com RESEND + SERVICE_ROLE a app envia o email. Outros Auth – modelos Supabase («Copiar para Supabase»).'),
  ('admin.email_design.editor_hint_auth', 'ru', 'Регистрация и сброс пароля: с RESEND + SERVICE_ROLE приложение шлёт письмо. Остальной Auth – шаблоны Supabase.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

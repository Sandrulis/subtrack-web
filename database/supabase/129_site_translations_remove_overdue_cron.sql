-- Noņemts kavēto maksājumu cron (/api/cron/overdue-payment-emails)
-- Palaid pēc 128_*.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('email.notifications.lead', 'lv', 'Izvēlies, kādus atgādinājumus saņemt uz reģistrētā e-pasta.'),
  ('email.notifications.lead', 'en', 'Choose which reminders to receive at your registered email.'),
  ('email.notifications.lead', 'fr', 'Choisissez les rappels à recevoir sur votre e-mail enregistré.'),
  ('email.notifications.lead', 'de', 'Wählen Sie, welche Erinnerungen Sie an Ihre registrierte E-Mail erhalten.'),
  ('email.notifications.lead', 'es', 'Elige qué recordatorios recibir en tu correo registrado.'),
  ('email.notifications.lead', 'pt', 'Escolha que lembretes receber no seu email registado.'),
  ('email.notifications.lead', 'ru', 'Выберите, какие напоминания получать на ваш email.'),
  ('admin.email_design.resend_hint', 'lv', 'Ar RESEND_API_KEY un EMAIL_FROM: reģistrācija, aizmirstā parole un cron e-pasti (šodien, nedēļas kopsavilkums, trial) no šī dizaina (UI valoda). Bez atslēgām Auth e-pastus sūta Supabase.'),
  ('admin.email_design.resend_hint', 'en', 'With RESEND_API_KEY and EMAIL_FROM: signup, password reset, and cron emails (due today, weekly summary, trial) from this design (UI language). Without keys, Auth uses Supabase.'),
  ('admin.email_design.resend_hint', 'fr', 'Avec RESEND_API_KEY et EMAIL_FROM : inscription, mot de passe oublié et e-mails cron depuis ce modèle (langue UI). Sinon Auth via Supabase.'),
  ('admin.email_design.resend_hint', 'de', 'Mit RESEND_API_KEY und EMAIL_FROM: Registrierung, Passwort vergessen und Cron-E-Mails aus diesem Design (UI-Sprache). Ohne Schlüssel: Supabase Auth.'),
  ('admin.email_design.resend_hint', 'es', 'Con RESEND_API_KEY y EMAIL_FROM: registro, contraseña olvidada y correos cron desde este diseño (idioma UI). Sin claves, Auth usa Supabase.'),
  ('admin.email_design.resend_hint', 'pt', 'Com RESEND_API_KEY e EMAIL_FROM: registo, palavra-passe e e-mails cron deste design (idioma UI). Sem chaves, Auth usa Supabase.'),
  ('admin.email_design.resend_hint', 'ru', 'С RESEND_API_KEY и EMAIL_FROM: регистрация, сброс пароля и cron-письма из шаблона (язык UI). Без ключей Auth через Supabase.'),
  ('admin.email_design.step_resend', 'lv', 'Cron: iestati RESEND_API_KEY, EMAIL_FROM, CRON_SECRET; plānots cron vai testē /admin/cron-jobs (due-today, weekly, trial, push).'),
  ('admin.email_design.step_resend', 'en', 'Cron: set RESEND_API_KEY, EMAIL_FROM, CRON_SECRET; schedule cron or test at /admin/cron-jobs (due-today, weekly, trial, push).'),
  ('admin.email_design.step_resend', 'fr', 'Cron : RESEND_API_KEY, EMAIL_FROM, CRON_SECRET ; planifiez ou testez via /admin/cron-jobs.'),
  ('admin.email_design.step_resend', 'de', 'Cron: RESEND_API_KEY, EMAIL_FROM, CRON_SECRET; Cron planen oder unter /admin/cron-jobs testen.'),
  ('admin.email_design.step_resend', 'es', 'Cron: RESEND_API_KEY, EMAIL_FROM, CRON_SECRET; programe o pruebe en /admin/cron-jobs.'),
  ('admin.email_design.step_resend', 'pt', 'Cron: RESEND_API_KEY, EMAIL_FROM, CRON_SECRET; agende ou teste em /admin/cron-jobs.'),
  ('admin.email_design.step_resend', 'ru', 'Cron: RESEND_API_KEY, EMAIL_FROM, CRON_SECRET; настройте или тест в /admin/cron-jobs.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

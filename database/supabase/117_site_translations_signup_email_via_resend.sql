-- Reģistrācijas apstiprinājums caur Resend + /admin/email-design (confirm_signup).
-- Palaid pēc 116_security_advisor_pro_trial_rpc.sql.

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.email_design.resend_hint', 'lv', 'Ar RESEND_API_KEY un EMAIL_FROM: reģistrācijas apstiprinājums no šī dizaina (lietotāja UI valodā) un kavētie maksājumi (cron). Bez atslēgām Auth e-pastus sūta Supabase.'),
  ('admin.email_design.resend_hint', 'en', 'With RESEND_API_KEY and EMAIL_FROM: signup confirmation from this design (user UI language) and overdue payments (cron). Without keys, Auth emails use Supabase.'),
  ('admin.email_design.resend_hint', 'fr', 'Avec RESEND_API_KEY et EMAIL_FROM : confirmation d''inscription depuis ce modèle (langue UI) et paiements en retard (cron). Sinon, les e-mails Auth passent par Supabase.'),
  ('admin.email_design.resend_hint', 'de', 'Mit RESEND_API_KEY und EMAIL_FROM: Registrierungsbestätigung aus diesem Design (UI-Sprache) und überfällige Zahlungen (Cron). Ohne Schlüssel sendet Supabase Auth-E-Mails.'),
  ('admin.email_design.resend_hint', 'es', 'Con RESEND_API_KEY y EMAIL_FROM: confirmación de registro desde este diseño (idioma UI) y pagos vencidos (cron). Sin claves, Auth usa Supabase.'),
  ('admin.email_design.resend_hint', 'pt', 'Com RESEND_API_KEY e EMAIL_FROM: confirmação de registo deste design (idioma UI) e pagamentos em atraso (cron). Sem chaves, Auth usa Supabase.'),
  ('admin.email_design.resend_hint', 'ru', 'С RESEND_API_KEY и EMAIL_FROM: подтверждение регистрации из этого шаблона (язык UI) и просрочка (cron). Без ключей Auth через Supabase.'),
  ('admin.email_design.editor_hint_auth', 'lv', 'Reģistrācija: ar RESEND + SERVICE_ROLE e-pastu sūta aplikācija pēc saglabātajiem tekstiem. Citi Auth veidi – Supabase šabloni („Kopēt Supabase”).'),
  ('admin.email_design.editor_hint_auth', 'en', 'Signup: with RESEND + SERVICE_ROLE the app sends mail from saved copy. Other Auth types – Supabase templates („Copy for Supabase”).'),
  ('admin.email_design.editor_hint_auth', 'fr', 'Inscription : avec RESEND + SERVICE_ROLE l''app envoie l''e-mail depuis ces textes. Autres Auth – modèles Supabase (« Copier pour Supabase »).'),
  ('admin.email_design.editor_hint_auth', 'de', 'Registrierung: mit RESEND + SERVICE_ROLE sendet die App nach gespeichertem Text. Andere Auth – Supabase-Vorlagen („Für Supabase kopieren“).'),
  ('admin.email_design.editor_hint_auth', 'es', 'Registro: con RESEND + SERVICE_ROLE la app envía el correo con estos textos. Otros Auth – plantillas Supabase («Copiar para Supabase»).'),
  ('admin.email_design.editor_hint_auth', 'pt', 'Registo: com RESEND + SERVICE_ROLE a app envia o email com estes textos. Outros Auth – modelos Supabase («Copiar para Supabase»).'),
  ('admin.email_design.editor_hint_auth', 'ru', 'Регистрация: с RESEND + SERVICE_ROLE приложение шлёт письмо из этих текстов. Остальной Auth – шаблоны Supabase.')
ON CONFLICT (translation_key, locale) DO UPDATE SET
  value = excluded.value,
  updated_at = now();

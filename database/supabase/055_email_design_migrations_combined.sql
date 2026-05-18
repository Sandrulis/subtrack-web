-- SubTrack: e-pasta dizains (051 + 052 + 053) – VIENS fails Supabase SQL Editor.
-- NEIZMANTO: `key`, backticks `, ON DUPLICATE KEY UPDATE (tas ir MySQL).
-- Ja 051/052/053 jau palaisti, atkārtota palaišana ir droša (IF NOT EXISTS / ON CONFLICT).

-- ---------- 051: system_settings.email_templates ----------
alter table public.system_settings
  add column if not exists email_templates jsonb not null default '{}'::jsonb;

comment on column public.system_settings.email_templates is
  'Pielāgoti e-pasta šabloni pa templateId/locale (admin e-pasta dizains).';

-- ---------- 052: email_reminder_log ----------
create table if not exists public.email_reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  reminder_type text not null default 'overdue',
  sent_on date not null default (current_date),
  created_at timestamptz not null default now(),
  constraint email_reminder_log_type_chk check (reminder_type in ('overdue')),
  constraint email_reminder_log_unique_per_day unique (
    user_id,
    subscription_id,
    reminder_type,
    sent_on
  )
);

create index if not exists email_reminder_log_sent_on_idx
  on public.email_reminder_log (sent_on);

comment on table public.email_reminder_log is
  'Transakciju e-pastu sūtīšanas žurnāls (deduplikācija). Tikai serveris (service_role).';

alter table public.email_reminder_log enable row level security;

-- ---------- 053: admin UI tulkojumi (7 valodas) ----------
INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  ('admin.nav.email_design', 'lv', 'E-pasti'),
  ('admin.nav.email_design', 'en', 'Emails'),
  ('admin.nav.email_design', 'fr', 'E-mails'),
  ('admin.nav.email_design', 'de', 'E-Mails'),
  ('admin.nav.email_design', 'es', 'Correos'),
  ('admin.nav.email_design', 'pt', 'E-mails'),
  ('admin.nav.email_design', 'ru', 'Письма'),

  ('meta.title.admin.email_design', 'lv', 'E-pasti'),
  ('meta.title.admin.email_design', 'en', 'Emails'),
  ('meta.title.admin.email_design', 'fr', 'E-mails'),
  ('meta.title.admin.email_design', 'de', 'E-Mails'),
  ('meta.title.admin.email_design', 'es', 'Correos'),
  ('meta.title.admin.email_design', 'pt', 'E-mails'),
  ('meta.title.admin.email_design', 'ru', 'Письма'),

  ('admin.email_design.heading', 'lv', 'E-pasta dizains'),
  ('admin.email_design.heading', 'en', 'Email design'),
  ('admin.email_design.heading', 'fr', 'Design des e-mails'),
  ('admin.email_design.heading', 'de', 'E-Mail-Design'),
  ('admin.email_design.heading', 'es', 'Diseño de correos'),
  ('admin.email_design.heading', 'pt', 'Design de e-mails'),
  ('admin.email_design.heading', 'ru', 'Дизайн писем'),

  ('admin.email_design.lead', 'lv', 'Priekšskatiet un pielāgojiet e-pastus visās programmas valodās (en, fr, de, es, pt, lv, ru). Noklusējuma teksti ir gatavi katrā valodā; pēc saglabāšanas Auth šablonus iekopē Supabase.'),
  ('admin.email_design.lead', 'en', 'Preview and edit emails in all app languages (en, fr, de, es, pt, lv, ru). Defaults exist for each language; after saving, paste Auth templates into Supabase.'),
  ('admin.email_design.lead', 'fr', 'Prévisualisez et modifiez les e-mails dans toutes les langues (en, fr, de, es, pt, lv, ru). Textes par défaut prêts ; après enregistrement, collez les modèles Auth dans Supabase.'),
  ('admin.email_design.lead', 'de', 'E-Mails in allen App-Sprachen (en, fr, de, es, pt, lv, ru) ansehen und anpassen. Standardtexte sind vorhanden; nach dem Speichern Auth-Vorlagen in Supabase einfügen.'),
  ('admin.email_design.lead', 'es', 'Previsualiza y edita correos en todos los idiomas (en, fr, de, es, pt, lv, ru). Textos por defecto listos; tras guardar, pega plantillas Auth en Supabase.'),
  ('admin.email_design.lead', 'pt', 'Pré-visualize e edite emails em todos os idiomas (en, fr, de, es, pt, lv, ru). Textos predefinidos prontos; após guardar, cole modelos Auth no Supabase.'),
  ('admin.email_design.lead', 'ru', 'Просматривайте и редактируйте письма на всех языках приложения (en, fr, de, es, pt, lv, ru). Тексты по умолчанию готовы; после сохранения вставьте шаблоны в Supabase.'),

  ('admin.email_design.template.confirm_signup', 'lv', 'Reģistrācija'),
  ('admin.email_design.template.confirm_signup', 'en', 'Sign up'),
  ('admin.email_design.template.confirm_signup', 'fr', 'Inscription'),
  ('admin.email_design.template.confirm_signup', 'de', 'Registrierung'),
  ('admin.email_design.template.confirm_signup', 'es', 'Registro'),
  ('admin.email_design.template.confirm_signup', 'pt', 'Registo'),
  ('admin.email_design.template.confirm_signup', 'ru', 'Регистрация'),

  ('admin.email_design.template.reset_password', 'lv', 'Parole'),
  ('admin.email_design.template.reset_password', 'en', 'Password'),
  ('admin.email_design.template.reset_password', 'fr', 'Mot de passe'),
  ('admin.email_design.template.reset_password', 'de', 'Passwort'),
  ('admin.email_design.template.reset_password', 'es', 'Contraseña'),
  ('admin.email_design.template.reset_password', 'pt', 'Palavra-passe'),
  ('admin.email_design.template.reset_password', 'ru', 'Пароль'),

  ('admin.email_design.template.magic_link', 'lv', 'Magic link'),
  ('admin.email_design.template.magic_link', 'en', 'Magic link'),
  ('admin.email_design.template.magic_link', 'fr', 'Magic link'),
  ('admin.email_design.template.magic_link', 'de', 'Magic link'),
  ('admin.email_design.template.magic_link', 'es', 'Magic link'),
  ('admin.email_design.template.magic_link', 'pt', 'Magic link'),
  ('admin.email_design.template.magic_link', 'ru', 'Magic link'),

  ('admin.email_design.template.email_change', 'lv', 'E-pasta maiņa'),
  ('admin.email_design.template.email_change', 'en', 'Email change'),
  ('admin.email_design.template.email_change', 'fr', 'Changement e-mail'),
  ('admin.email_design.template.email_change', 'de', 'E-Mail-Änderung'),
  ('admin.email_design.template.email_change', 'es', 'Cambio de correo'),
  ('admin.email_design.template.email_change', 'pt', 'Alteração de email'),
  ('admin.email_design.template.email_change', 'ru', 'Смена email'),

  ('admin.email_design.template.invite_user', 'lv', 'Uzaicinājums'),
  ('admin.email_design.template.invite_user', 'en', 'Invite'),
  ('admin.email_design.template.invite_user', 'fr', 'Invitation'),
  ('admin.email_design.template.invite_user', 'de', 'Einladung'),
  ('admin.email_design.template.invite_user', 'es', 'Invitación'),
  ('admin.email_design.template.invite_user', 'pt', 'Convite'),
  ('admin.email_design.template.invite_user', 'ru', 'Приглашение'),

  ('admin.email_design.template.reauthentication', 'lv', 'Re-auth'),
  ('admin.email_design.template.reauthentication', 'en', 'Re-auth'),
  ('admin.email_design.template.reauthentication', 'fr', 'Re-auth'),
  ('admin.email_design.template.reauthentication', 'de', 'Re-auth'),
  ('admin.email_design.template.reauthentication', 'es', 'Re-auth'),
  ('admin.email_design.template.reauthentication', 'pt', 'Re-auth'),
  ('admin.email_design.template.reauthentication', 'ru', 'Re-auth'),

  ('admin.email_design.template.overdue_payment', 'lv', 'Kavēts maksājums'),
  ('admin.email_design.template.overdue_payment', 'en', 'Overdue payment'),
  ('admin.email_design.template.overdue_payment', 'fr', 'Paiement en retard'),
  ('admin.email_design.template.overdue_payment', 'de', 'Überfällige Zahlung'),
  ('admin.email_design.template.overdue_payment', 'es', 'Pago vencido'),
  ('admin.email_design.template.overdue_payment', 'pt', 'Pagamento em atraso'),
  ('admin.email_design.template.overdue_payment', 'ru', 'Просрочка'),

  ('admin.email_design.save', 'lv', 'Saglabāt'),
  ('admin.email_design.save', 'en', 'Save'),
  ('admin.email_design.save', 'fr', 'Enregistrer'),
  ('admin.email_design.save', 'de', 'Speichern'),
  ('admin.email_design.save', 'es', 'Guardar'),
  ('admin.email_design.save', 'pt', 'Guardar'),
  ('admin.email_design.save', 'ru', 'Сохранить'),

  ('admin.email_design.copy_supabase', 'lv', 'Kopēt Supabase'),
  ('admin.email_design.copy_supabase', 'en', 'Copy for Supabase'),
  ('admin.email_design.copy_supabase', 'fr', 'Copier pour Supabase'),
  ('admin.email_design.copy_supabase', 'de', 'Für Supabase kopieren'),
  ('admin.email_design.copy_supabase', 'es', 'Copiar para Supabase'),
  ('admin.email_design.copy_supabase', 'pt', 'Copiar para Supabase'),
  ('admin.email_design.copy_supabase', 'ru', 'Копировать для Supabase'),

  ('admin.email_design.resend_hint', 'lv', 'Kavēto maksājumu sūtīšanai vajag RESEND_API_KEY un EMAIL_FROM (.env). Auth e-pastus joprojām sūta Supabase.'),
  ('admin.email_design.resend_hint', 'en', 'Overdue emails need RESEND_API_KEY and EMAIL_FROM in .env. Auth emails still go through Supabase.'),
  ('admin.email_design.resend_hint', 'fr', 'Les e-mails de retard nécessitent RESEND_API_KEY et EMAIL_FROM. Les e-mails Auth passent par Supabase.'),
  ('admin.email_design.resend_hint', 'de', 'Überfällige E-Mails benötigen RESEND_API_KEY und EMAIL_FROM. Auth-E-Mails laufen über Supabase.'),
  ('admin.email_design.resend_hint', 'es', 'Los correos de retraso requieren RESEND_API_KEY y EMAIL_FROM. Los Auth siguen por Supabase.'),
  ('admin.email_design.resend_hint', 'pt', 'Emails em atraso precisam de RESEND_API_KEY e EMAIL_FROM. Auth continua via Supabase.'),
  ('admin.email_design.resend_hint', 'ru', 'Для просрочки нужны RESEND_API_KEY и EMAIL_FROM. Auth по-прежнему через Supabase.')
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();

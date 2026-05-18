-- E-pasta šablonu teksti (admin /admin/email-design) glabājas system_settings.

alter table public.system_settings
  add column if not exists email_templates jsonb not null default '{}'::jsonb;

comment on column public.system_settings.email_templates is
  'Pielāgoti e-pasta šabloni pa templateId/locale (admin e-pasta dizains).';

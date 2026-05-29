-- SubTrack: atbalsta pieprasījumu e-pasts (admin /admin/system).
-- Palaid pēc 148_users_registration_country.sql (un 012_system_settings).

alter table public.system_settings
  add column if not exists support_contact_email text;

comment on column public.system_settings.support_contact_email is
  'E-pasts, uz kuru sūtīt ielogotu lietotāju atbalsta ziņojumus (Resend). Tukšs = atbalsts izslēgts.';

alter table public.system_settings drop constraint if exists system_settings_support_contact_email_chk;
alter table public.system_settings
  add constraint system_settings_support_contact_email_chk check (
    support_contact_email is null
    or (
      char_length(trim(support_contact_email)) between 3 and 254
      and trim(support_contact_email) ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    )
  );

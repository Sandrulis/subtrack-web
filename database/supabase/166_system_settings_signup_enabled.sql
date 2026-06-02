-- SubTrack: admin slēdzis jaunu lietotāju reģistrācijai (/signup, nav, server actions).
-- Palaid pēc 165_handle_new_user_geo_ui_language.sql (un 012_system_settings).

alter table public.system_settings
  add column if not exists signup_enabled boolean not null default true;

comment on column public.system_settings.signup_enabled is
  'Ja false, /signup un reģistrācijas UI ir slēgti; esošie lietotāji var pieteikties.';

-- repazy: PWA iestatījumi system_settings (admin /admin/pwa).
-- Palaid pēc 027_paid_plan.sql.

alter table public.system_settings
  add column if not exists pwa_enabled boolean not null default true;

alter table public.system_settings
  add column if not exists pwa_install_banner_enabled boolean not null default true;

alter table public.system_settings
  add column if not exists pwa_install_settings_enabled boolean not null default true;

alter table public.system_settings
  add column if not exists pwa_cache_revision integer not null default 1;

alter table public.system_settings
  add column if not exists pwa_theme_color text;

alter table public.system_settings
  add column if not exists pwa_background_color text;

alter table public.system_settings
  add column if not exists pwa_short_name text;

alter table public.system_settings drop constraint if exists system_settings_pwa_cache_revision_chk;
alter table public.system_settings
  add constraint system_settings_pwa_cache_revision_chk check (pwa_cache_revision >= 1);

comment on column public.system_settings.pwa_enabled is
  'PWA: service worker un instalācijas UX.';
comment on column public.system_settings.pwa_install_banner_enabled is
  'PWA: mobilais instalācijas banneris.';
comment on column public.system_settings.pwa_install_settings_enabled is
  'PWA: instalācijas sadaļa lietotāja iestatījumos.';
comment on column public.system_settings.pwa_cache_revision is
  'PWA: klientu konfigurācijas revīzija (bump no admin).';

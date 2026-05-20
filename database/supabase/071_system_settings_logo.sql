-- Pielāgots produkta logo (PWA ikonas, favicon, topbar).
-- Palaid pēc 068_system_settings_pwa.sql.

alter table public.system_settings
  add column if not exists logo_revision integer not null default 0;

alter table public.system_settings drop constraint if exists system_settings_logo_revision_chk;
alter table public.system_settings
  add constraint system_settings_logo_revision_chk check (logo_revision >= 0);

comment on column public.system_settings.logo_revision is
  '0 = ģenerētais noklusējuma zīmols; >0 = augšupielādēts logo (storage brand). Palielinās par 1 katrā augšupielādē (?v= kešam).';

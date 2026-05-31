-- Atsevišķs augšējās navigācijas logo (neatkarīgi no PWA / favicon ikonām).
-- Palaid pēc 071_system_settings_logo.sql.

alter table public.system_settings
  add column if not exists topbar_logo_revision integer not null default 0;

alter table public.system_settings drop constraint if exists system_settings_topbar_logo_revision_chk;
alter table public.system_settings
  add constraint system_settings_topbar_logo_revision_chk check (topbar_logo_revision >= 0);

comment on column public.system_settings.topbar_logo_revision is
  '0 = nav atsevišķa topbar logo (fallback uz icon-64, ja logo_revision > 0); >0 = storage brand/topbar-logo.png (?v= kešam).';

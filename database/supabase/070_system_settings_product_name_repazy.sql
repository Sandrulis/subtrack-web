-- Produkta nosaukums: SubTrack -> repazy (tikai ja vēl nav mainīts).
-- Palaid pēc 012_system_settings.sql.

update public.system_settings
set system_name = 'repazy'
where id = 1
  and system_name in ('SubTrack', 'subtrack');

-- Atļauj publisku lasīšanu topbar-logo.png (kopā ar PWA ikonām).
-- Palaid pēc 072_brand_storage.sql (vai 080, ja jau pielāgots).

drop policy if exists "brand_objects_select_known_files" on storage.objects;

create policy "brand_objects_select_known_files"
  on storage.objects for select
  to public
  using (
    bucket_id = 'brand'
    and name in (
      'icon-32.png',
      'icon-64.png',
      'icon-180.png',
      'icon-192.png',
      'icon-512.png',
      'icon-512-maskable.png',
      'topbar-logo.png'
    )
    and storage.allow_only_operation('object.get')
  );

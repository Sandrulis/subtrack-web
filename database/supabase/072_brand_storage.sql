-- Publisks storage buckets augšupielādētajam produkta logo.
-- Augšupielāde: lib/admin/logo-actions.ts – requireAdminUser(), tad service_role (apiet storage RLS).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand',
  'brand',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "brand_objects_select_public" on storage.objects;
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
      'icon-512-maskable.png'
    )
    and storage.allow_only_operation('object.get')
  );

drop policy if exists "brand_objects_insert_admin" on storage.objects;
create policy "brand_objects_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'brand' and public.current_user_is_admin());

drop policy if exists "brand_objects_update_admin" on storage.objects;
create policy "brand_objects_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'brand' and public.current_user_is_admin())
  with check (bucket_id = 'brand' and public.current_user_is_admin());

drop policy if exists "brand_objects_delete_admin" on storage.objects;
create policy "brand_objects_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'brand' and public.current_user_is_admin());

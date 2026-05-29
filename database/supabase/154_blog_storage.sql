-- Blog attēlu storage (publiska lasīšana, augšupielāde tikai admin).
-- Palaid pēc 153_blog_posts.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog',
  'blog',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "blog_objects_select_public" on storage.objects;
create policy "blog_objects_select_public"
  on storage.objects for select
  to public
  using (
    bucket_id = 'blog'
    and storage.allow_only_operation('object.get')
  );

drop policy if exists "blog_objects_insert_admin" on storage.objects;
create policy "blog_objects_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog' and public.current_user_is_admin());

drop policy if exists "blog_objects_update_admin" on storage.objects;
create policy "blog_objects_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog' and public.current_user_is_admin())
  with check (bucket_id = 'blog' and public.current_user_is_admin());

drop policy if exists "blog_objects_delete_admin" on storage.objects;
create policy "blog_objects_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog' and public.current_user_is_admin());

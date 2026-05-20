-- Supabase Security Advisor: 4 warnings (storage brand, admin_set_user_pro_vip, skat. README par Auth).
-- Palaid pēc 043_users_pro_vip.sql un 072_brand_storage.sql.

-- -----------------------------------------------------------------------------
-- 1) storage.brand – publiska lasīšana tikai zināmiem logo failiem; bez bucket listing
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 2) admin_set_user_pro_vip – EXECUTE tikai service_role (kā signup_email_exists)
--    Route Handler pārbauda admin ar sesiju, RPC izsauc serverī ar service_role.
-- -----------------------------------------------------------------------------
revoke all on function public.admin_set_user_pro_vip(uuid, boolean) from public;
revoke all on function public.admin_set_user_pro_vip(uuid, boolean) from anon, authenticated;
grant execute on function public.admin_set_user_pro_vip(uuid, boolean) to service_role;

comment on function public.admin_set_user_pro_vip(uuid, boolean) is
  'SECURITY DEFINER: tikai service_role (servera API pēc admin pārbaudes).';

-- -----------------------------------------------------------------------------
-- 3) Leaked password protection – nav SQL; ieslēdz Supabase Dashboard:
--    Authentication → Providers → Email → "Prevent use of leaked passwords"
--    (Pro plānā; Free projektā Advisor brīdinājums var palikt).

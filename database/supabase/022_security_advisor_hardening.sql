-- SubTrack / Supabase Security Advisor atbilstība (daļēja).
-- Palaid SQL Editor pēc 016 (vai vismaz pēc 001, 003, 007, 008, 011, 012).
--
-- Kas tiek labots:
-- 1) public.set_updated_at – fiksēts search_path (novērš „Function search path mutable”).
-- 2) Trigeru SECURITY DEFINER funkcijas – atņemta EXECUTE no PUBLIC/anon/authenticated
--    (trigeri joprojām darbojas; tiešas RPC izsaukšanas no klienta vairs nav).
-- 3) RLS politikas ar current_user_is_admin – sašaurinātas uz lomu "authenticated", lai
--    anon vairs neizpilda šo funkciju politiku novērtēšanai; pēc tam anon tiek atņemts
--    EXECUTE uz current_user_is_admin (salīdzinājumā ar 003/005).
--
-- Kas paliek līdz 023:
-- - public.signup_email_exists: DEFINER + anon EXECUTE – novērš **`023_security_advisor_rpcs.sql`** (service_role).
-- - Leaked password protection: ieslēdz manuāli (Authentication → pie „leaked password” / HaveIBeenPwned).

-- -----------------------------------------------------------------------------
-- 1) updated_at trigeris
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2) Trigeriem nav jābūt izsaucamām kā RPC no anon / authenticated
-- -----------------------------------------------------------------------------
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon, authenticated;

revoke all on function public.sync_public_user_email_from_auth() from public;
revoke all on function public.sync_public_user_email_from_auth() from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3) Admin RLS politikas tikai authenticated lomai (anon tās vairs nenovērtē)
-- -----------------------------------------------------------------------------

-- 003: users
drop policy if exists "users_select_all_if_admin" on public.users;
create policy "users_select_all_if_admin"
  on public.users for select
  to authenticated
  using (public.current_user_is_admin());

-- 008: subscriptions
drop policy if exists "subscriptions_select_all_if_admin" on public.subscriptions;
create policy "subscriptions_select_all_if_admin"
  on public.subscriptions for select
  to authenticated
  using (public.current_user_is_admin());

-- 007: languages (admin CRUD; publiskās SELECT politikas paliek kā 009/010)
drop policy if exists "languages_select_admin" on public.languages;
create policy "languages_select_admin"
  on public.languages for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "languages_insert_admin" on public.languages;
create policy "languages_insert_admin"
  on public.languages for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "languages_update_admin" on public.languages;
create policy "languages_update_admin"
  on public.languages for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "languages_delete_admin" on public.languages;
create policy "languages_delete_admin"
  on public.languages for delete
  to authenticated
  using (public.current_user_is_admin());

-- 011: site_translations (admin; publiskā SELECT paliek 012_site_translations_select_public)
drop policy if exists "site_translations_select_admin" on public.site_translations;
create policy "site_translations_select_admin"
  on public.site_translations for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "site_translations_insert_admin" on public.site_translations;
create policy "site_translations_insert_admin"
  on public.site_translations for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "site_translations_update_admin" on public.site_translations;
create policy "site_translations_update_admin"
  on public.site_translations for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "site_translations_delete_admin" on public.site_translations;
create policy "site_translations_delete_admin"
  on public.site_translations for delete
  to authenticated
  using (public.current_user_is_admin());

-- 012: system_settings (UPDATE tikai adminiem; SELECT publiskā paliek)
drop policy if exists "system_settings_update_admin" on public.system_settings;
create policy "system_settings_update_admin"
  on public.system_settings for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- -----------------------------------------------------------------------------
-- 4) current_user_is_admin – RPC tikai ielogotajiem (anon nevajag pēc politiku šaurināšanas)
-- -----------------------------------------------------------------------------
revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_is_admin() from anon;
grant execute on function public.current_user_is_admin() to authenticated;

comment on function public.current_user_is_admin() is
  'RLS un paneļa loģika: vai sesijas lietotājam ir is_admin > 0. SECURITY DEFINER; EXECUTE tikai authenticated (pēc 022).';

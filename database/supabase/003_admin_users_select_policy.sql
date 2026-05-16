-- Adminiem (is_admin > 0) atļaut lasīt visu public.users sarakstu.
-- Bez papildu SELECT politikas anon sesija redz tikai savu rindiņu (users_select_own).
-- Palaid pēc 001_initial_schema.sql.
--
-- SVARĪGI: politikas USING nedrīkst saturēt EXISTS (SELECT ... FROM public.users ...),
-- jo Postgres RLS tad nosaka "infinite recursion detected in policy for relation users".
-- Tāpēc vispirms SECURITY DEFINER funkcija, kas lasa users ar īpašnieka tiesībām.

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.is_admin > 0
  );
$$;

comment on function public.current_user_is_admin() is
  'RLS un paneļa loģika: vai sesijas lietotājam ir is_admin > 0. SECURITY DEFINER, tikai lasīšana pēc auth.uid().';

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to anon, authenticated;

drop policy if exists "users_select_all_if_admin" on public.users;
create policy "users_select_all_if_admin"
  on public.users for select
  using (public.current_user_is_admin());

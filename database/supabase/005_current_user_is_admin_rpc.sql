-- Idempotents atkārtojums: public.current_user_is_admin() + grants.
-- Pilna migrācija (ieskaitot RLS politiku users_select_all_if_admin) ir
-- database/supabase/003_admin_users_select_policy.sql — to palaid, ja redzi
-- kļūdu "infinite recursion detected in policy for relation users".

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
  'Paneļa / admin zona: vai sesijas lietotājam ir is_admin > 0. SECURITY DEFINER, tikai lasīšana pēc auth.uid().';

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to anon, authenticated;

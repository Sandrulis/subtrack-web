-- Administratoriem (is_admin > 0) atļaut lasīt visus public.subscriptions ierakstus.
-- Nepieciešams admin lietotāju saraksta kopsavilkumiem (/admin/users).
-- Palaid pēc 003_admin_users_select_policy.sql (vajadzīga funkcija current_user_is_admin).

drop policy if exists "subscriptions_select_all_if_admin" on public.subscriptions;

create policy "subscriptions_select_all_if_admin"
  on public.subscriptions for select
  using (public.current_user_is_admin());

comment on policy "subscriptions_select_all_if_admin" on public.subscriptions is
  'Adminiem SELECT pa visām rindām; pārējiem joprojām subscriptions_select_own utt.';

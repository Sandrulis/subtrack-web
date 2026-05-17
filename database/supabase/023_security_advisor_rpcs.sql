-- SubTrack – atlikušie Security Advisor punkti par RPC (pēc 022).
-- 1) current_user_is_admin: SECURITY INVOKER – vairs nav „signed-in executes DEFINER” brīdinājuma;
--    funkcija tikai pārbauda public.users rindu ar auth.uid() (RLS: users_select_own).
-- 2) signup_email_exists: paliek SECURITY DEFINER (lasīšana auth.users), bet EXECUTE tikai service_role –
--    Next servera Server Action izsauc ar SUPABASE_SERVICE_ROLE_KEY (skat. lib/auth/actions.ts).
--
-- Pirms šī soļa pārliecinies, ka .env.local satur SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API),
-- citādi signup „e-pasts jau aizņemts” pārbaude no servera nedarbosies.

-- -----------------------------------------------------------------------------
-- current_user_is_admin → SECURITY INVOKER
-- -----------------------------------------------------------------------------
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security invoker
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
  'SECURITY INVOKER: lasa tikai savu public.users rindu via RLS; nav nepieciešams DEFINER.';

revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_is_admin() from anon;
grant execute on function public.current_user_is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- signup_email_exists → tikai service_role (anon/ authenticated vairs nevar izsaukt tieši)
-- -----------------------------------------------------------------------------
create or replace function public.signup_email_exists(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users au
    where au.email is not null
      and lower(btrim(au.email::text)) = lower(btrim(p_email))
  );
$$;

comment on function public.signup_email_exists(text) is
  'Signup: vai auth.users satur e-pastu. SECURITY DEFINER; EXECUTE tikai service_role (serveris).';

revoke all on function public.signup_email_exists(text) from public;
revoke all on function public.signup_email_exists(text) from anon, authenticated;
grant execute on function public.signup_email_exists(text) to service_role;

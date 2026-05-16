-- E-pasta nosaukšana reģistrācijas formā (anon var izsaukt tikai šo funkciju).
-- Palaid SQL Editor pēc iepriekšējām migrācijām.

create or replace function public.signup_email_exists(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from auth.users au
    where au.email is not null
      and lower(btrim(au.email::text)) = lower(btrim(p_email))
  );
$$;

comment on function public.signup_email_exists(text) is
  'Signup UX: vai auth.users jau satur šo e-pastu. SECURITY DEFINER lai anon var izsaukt.';

revoke all on function public.signup_email_exists(text) from public;
grant execute on function public.signup_email_exists(text) to anon, authenticated;

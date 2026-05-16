-- Sinhronizē `auth.users.email` -> `public.users.email` pēc e-pasta maiņas Auth pusē (M1).
-- Palaid SQL Editor kā `postgres` / ar tiesībām izveidot trigerus uz `auth.users`.
-- Sagaida, ka eksistē `public.users` un kolonna `email` (`001_*`).

create or replace function public.sync_public_user_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users u
  set email = coalesce(lower(trim(new.email)), '')
  where u.id = new.id;
  return new;
end;
$$;

comment on function public.sync_public_user_email_from_auth() is
  'Pēc Auth e-pasta maiņas atsvaidzina public.users.email (SECURITY DEFINER). Klientiem ar anon atslēgu `email` joprojām nedrīkst mainīt manuāli; skatīt RLS policies.';

drop trigger if exists on_auth_user_email_updated on auth.users;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_public_user_email_from_auth();

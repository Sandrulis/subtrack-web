-- Neļauj atkārtoti reģistrēties ar e-pastu, kas kādreiz dzēsts no auth.users.
-- Palaid SQL Editor kā postgres (trigeris uz auth.users). Pēc 118_*.

-- -----------------------------------------------------------------------------
-- Tabula: dzēsti / aizliegti reģistrācijas e-pasti (normalizēti)
-- -----------------------------------------------------------------------------
create table if not exists public.retired_signup_emails (
  email_normalized text primary key,
  retired_at timestamptz not null default now(),
  source text not null default 'auth_delete'
);

comment on table public.retired_signup_emails is
  'E-pasti, ar kuriem vairs nedrīkst veidot jaunu kontu pēc Auth lietotāja dzēšanas.';

alter table public.retired_signup_emails enable row level security;

-- Skaidras deny politikas (Advisor "RLS Enabled No Policy"); piekļuve tikai service_role / DEFINER.
drop policy if exists "retired_signup_emails_deny_anon" on public.retired_signup_emails;
create policy "retired_signup_emails_deny_anon"
  on public.retired_signup_emails for all
  to anon
  using (false)
  with check (false);

drop policy if exists "retired_signup_emails_deny_authenticated" on public.retired_signup_emails;
create policy "retired_signup_emails_deny_authenticated"
  on public.retired_signup_emails for all
  to authenticated
  using (false)
  with check (false);

-- -----------------------------------------------------------------------------
-- Trigeris: pēc dzēšanas no auth.users saglabāt e-pastu
-- -----------------------------------------------------------------------------
create or replace function public.retire_signup_email_on_auth_user_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  v_email := lower(btrim(coalesce(old.email::text, '')));
  if v_email = '' or position('@' in v_email) = 0 then
    return old;
  end if;

  insert into public.retired_signup_emails (email_normalized, source)
  values (v_email, 'auth_delete')
  on conflict (email_normalized) do nothing;

  return old;
end;
$$;

comment on function public.retire_signup_email_on_auth_user_delete() is
  'Pēc auth.users DELETE ieraksta e-pastu retired_signup_emails (atkārtota reģistrācija liegta).';

revoke all on function public.retire_signup_email_on_auth_user_delete() from public;
revoke all on function public.retire_signup_email_on_auth_user_delete() from anon;
revoke all on function public.retire_signup_email_on_auth_user_delete() from authenticated;

drop trigger if exists on_auth_user_deleted_retire_signup_email on auth.users;

create trigger on_auth_user_deleted_retire_signup_email
  after delete on auth.users
  for each row
  execute function public.retire_signup_email_on_auth_user_delete();

-- -----------------------------------------------------------------------------
-- Manuāla aizliegšana / backfill (tikai serveris)
-- -----------------------------------------------------------------------------
create or replace function public.retire_signup_email(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  v_email := lower(btrim(coalesce(p_email, '')));
  if v_email = '' or position('@' in v_email) = 0 then
    return;
  end if;
  insert into public.retired_signup_emails (email_normalized, source)
  values (v_email, 'manual')
  on conflict (email_normalized) do nothing;
end;
$$;

comment on function public.retire_signup_email(text) is
  'Pievieno e-pastu retired_signup_emails (backfill pēc dzēšanas pirms migrācijas). EXECUTE tikai service_role.';

revoke all on function public.retire_signup_email(text) from public;
revoke all on function public.retire_signup_email(text) from anon, authenticated;
grant execute on function public.retire_signup_email(text) to service_role;

-- -----------------------------------------------------------------------------
-- signup_email_exists: aktīvs auth.users VAI retired saraksts
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
  )
  or exists (
    select 1
    from public.retired_signup_emails r
    where r.email_normalized = lower(btrim(p_email))
  );
$$;

comment on function public.signup_email_exists(text) is
  'Signup: e-pasts aizņemts (auth.users) vai dzēsts (retired_signup_emails). EXECUTE tikai service_role.';

revoke all on function public.signup_email_exists(text) from public;
revoke all on function public.signup_email_exists(text) from anon, authenticated;
grant execute on function public.signup_email_exists(text) to service_role;

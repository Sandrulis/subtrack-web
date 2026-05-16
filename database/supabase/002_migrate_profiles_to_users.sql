-- Pārejai no vecās shēmas (public.profiles) uz public.users.
-- Palaid TIKAI ja iepriekš jau bija palaists vecais `001_initial_schema.sql` ar `profiles`.

-- -----------------------------------------------------------------------------
-- Izveido public.users ja vēl nav
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  surname text not null default '',
  email text not null default '',
  is_admin integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (lower(email));

-- -----------------------------------------------------------------------------
-- Kopē uz users no profiles (+ e-pasts no auth.users)
-- -----------------------------------------------------------------------------
insert into public.users (id, name, surname, email, is_admin)
select
  p.id,
  coalesce(p.first_name, ''),
  coalesce(p.last_name, ''),
  coalesce(lower(trim(au.email)), ''),
  0
from public.profiles p
inner join auth.users au on au.id = p.id
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- RLS politikās users tabulai (ja bija tikai profiles)
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Triggeris: līdz vietai public.users vietā profiles
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_surname text;
begin
  v_name :=
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'given_name'), ''),
      ''
    );

  v_surname :=
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'family_name'), ''),
      ''
    );

  insert into public.users (id, name, surname, email, is_admin)
  values (
    new.id,
    v_name,
    v_surname,
    coalesce(lower(trim(new.email)), ''),
    0
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Triggeris updated_at uz users
-- -----------------------------------------------------------------------------
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Novaļ vecā profiles tabula un attiecīgās politikās
-- -----------------------------------------------------------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop table if exists public.profiles;

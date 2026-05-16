-- SubTrack: sākuma shēma Supabase (Postgres + Auth + RLS)
-- Palaid Supabase SQL Editor: New query -> ielīmē -> Run.
-- Secība: tabulas -> RLS -> politikas -> trigeri.

-- -----------------------------------------------------------------------------
-- Public lietotāji (viens‑pret‑vienu ar auth.users)
-- -----------------------------------------------------------------------------
-- Piezīme par paroli: nekādā gadījumā nekodēt plain teksta paroli šeit -
-- parole un OAuth identitātes glabājas Supabase auth.users (Authentication).

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  surname text not null default '',
  email text not null default '',
  is_admin integer not null default 0,
  display_preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'Papildlauki; id = auth.users.id; parole tikai Auth, ne šeit.';

create index if not exists users_email_idx on public.users (lower(email));

-- -----------------------------------------------------------------------------
-- Abonementu ieraksti (atbilst FS demo laukumiem)
-- -----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null default 'subscription',
  amount numeric(12, 2) not null,
  period text not null default 'monthly',
  next_payment_date date not null,
  icon text,
  color text,
  note text,
  term_start date,
  term_end date,
  devices jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_category_chk check (
    category in (
      'subscription',
      'bill',
      'credit',
      'leasing',
      'insurance',
      'other'
    )
  ),
  constraint subscriptions_period_chk check (
    period in ('monthly', 'yearly', 'weekly')
  )
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_next_pay_idx on public.subscriptions (next_payment_date);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "subscriptions_delete_own" on public.subscriptions;
create policy "subscriptions_delete_own"
  on public.subscriptions for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Jauns lietotājs Auth -> public.users (e-pasta reģistrācija + OAuth)
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

-- Ja Postgres sūdzas par "execute function", mēģini:
-- for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- updated_at automātika
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

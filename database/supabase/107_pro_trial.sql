-- SubTrack: Pro izmēģinājums jaunajiem lietotājiem (admin dienu skaits, viens reizi uz kontu).
-- Palaid pēc 106_site_translations_landing_pricing_ui.sql (un 027, 043, 012).

-- -----------------------------------------------------------------------------
-- system_settings
-- -----------------------------------------------------------------------------
alter table public.system_settings
  add column if not exists pro_trial_enabled boolean not null default false;

alter table public.system_settings
  add column if not exists pro_trial_days integer not null default 14;

alter table public.system_settings drop constraint if exists system_settings_pro_trial_days_chk;
alter table public.system_settings
  add constraint system_settings_pro_trial_days_chk check (
    pro_trial_days >= 1
    and pro_trial_days <= 365
  );

comment on column public.system_settings.pro_trial_enabled is
  'Ja true un maksas plāns ieslēgts, jaunajiem lietotājiem tiek piešķirts Pro izmēģinājums.';
comment on column public.system_settings.pro_trial_days is
  'Pro izmēģinājuma ilgums dienās no reģistrācijas brīža.';

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
alter table public.users
  add column if not exists pro_trial_used boolean not null default false;

alter table public.users
  add column if not exists pro_trial_started_at timestamptz;

comment on column public.users.pro_trial_used is
  'Vienreizējs: true pēc izmēģinājuma piešķiršanas reģistrācijā; netiek atiestatīts.';
comment on column public.users.pro_trial_started_at is
  'Izmēģinājuma sākums (parasti reģistrācijas laiks).';

-- -----------------------------------------------------------------------------
-- RLS: pro_trial_* tikai nemaināms caur „sava profila” UPDATE
-- -----------------------------------------------------------------------------
drop policy if exists "users_update_own" on public.users;

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin is not distinct from (
      select u.is_admin from public.users u where u.id = auth.uid()
    )
    and email is not distinct from (
      select u.email from public.users u where u.id = auth.uid()
    )
    and paid_plan_active is not distinct from (
      select u.paid_plan_active from public.users u where u.id = auth.uid()
    )
    and pro_vip is not distinct from (
      select u.pro_vip from public.users u where u.id = auth.uid()
    )
    and pro_trial_used is not distinct from (
      select u.pro_trial_used from public.users u where u.id = auth.uid()
    )
    and pro_trial_started_at is not distinct from (
      select u.pro_trial_started_at from public.users u where u.id = auth.uid()
    )
  );

comment on policy "users_update_own" on public.users is
  'Lietotājs drīkst labot neatkarīgos laukus; is_admin, email, paid_plan_active, pro_vip, pro_trial_* - nē.';

-- -----------------------------------------------------------------------------
-- Jauns lietotājs: Pro izmēģinājums, ja admin ieslēdzis
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
  v_prefs jsonb;
  v_overlay jsonb;
  v_ui_lang text;
  v_trial_days integer := 0;
  v_grant_trial boolean := false;
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

  select coalesce(
    (select nullif(trim(lower(l.code)), '') from public.languages l where l.is_default limit 1),
    'lv'
  )
    into v_ui_lang;

  select coalesce(s.default_display_preferences, '{}'::jsonb)
    into v_overlay
  from public.system_settings s
  where s.id = 1;

  select
    coalesce(s.paid_plan_enabled, false) and coalesce(s.pro_trial_enabled, false),
    greatest(coalesce(s.pro_trial_days, 0), 0)
    into v_grant_trial, v_trial_days
  from public.system_settings s
  where s.id = 1;

  v_grant_trial := v_grant_trial and v_trial_days >= 1;

  v_prefs :=
    jsonb_build_object(
      'interface_language_code', v_ui_lang,
      'currency', 'EUR',
      'date_order', 'dmy',
      'date_sep', '.',
      'time_format', '24',
      'time_sep', ':',
      'timezone', 'Europe/Riga',
      'week_start', 'monday'
    )
    || coalesce(v_overlay, '{}'::jsonb);

  insert into public.users (
    id,
    name,
    surname,
    email,
    is_admin,
    display_preferences,
    pro_trial_used,
    pro_trial_started_at
  )
  values (
    new.id,
    v_name,
    v_surname,
    coalesce(lower(trim(new.email)), ''),
    0,
    v_prefs,
    v_grant_trial,
    case when v_grant_trial then now() else null end
  );

  return new;
end;
$$;

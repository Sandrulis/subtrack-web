-- OAuth profila bilde (Google u.c.) -> public.users.avatar_url
-- Palaid pēc 107_pro_trial.sql (handle_new_user) un 016_*.

alter table public.users
add column if not exists avatar_url text;

comment on column public.users.avatar_url is
  'HTTPS profila bildes URL no Auth user_metadata (avatar_url / picture); inicialēs, ja tukšs.';

-- -----------------------------------------------------------------------------
-- Jauns lietotājs: vārds no full_name, avatar_url no metadata
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
  v_full text;
  v_space integer;
  v_avatar_url text;
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

  if v_name = '' and v_surname = '' then
    v_full :=
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        ''
      );
    if v_full <> '' then
      v_space := position(' ' in v_full);
      if v_space > 0 then
        v_name := trim(substring(v_full from 1 for v_space - 1));
        v_surname := trim(substring(v_full from v_space + 1));
      else
        v_name := v_full;
      end if;
    end if;
  end if;

  v_avatar_url :=
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
    );

  if v_avatar_url is not null and v_avatar_url !~ '^https://' then
    v_avatar_url := null;
  end if;

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
    pro_trial_started_at,
    avatar_url
  )
  values (
    new.id,
    v_name,
    v_surname,
    coalesce(lower(trim(new.email)), ''),
    0,
    v_prefs,
    v_grant_trial,
    case when v_grant_trial then now() else null end,
    v_avatar_url
  );

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Esošie OAuth lietotāji: atsvaidzina avatar_url pēc Auth metadata maiņas
-- -----------------------------------------------------------------------------
create or replace function public.sync_public_user_avatar_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avatar_url text;
begin
  v_avatar_url :=
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
    );

  if v_avatar_url is null or v_avatar_url !~ '^https://' then
    return new;
  end if;

  update public.users u
  set avatar_url = v_avatar_url
  where u.id = new.id;

  return new;
end;
$$;

comment on function public.sync_public_user_avatar_from_auth() is
  'Pēc Auth user_metadata maiņas sinhronizē public.users.avatar_url (SECURITY DEFINER).';

drop trigger if exists on_auth_user_avatar_updated on auth.users;

create trigger on_auth_user_avatar_updated
  after update of raw_user_meta_data on auth.users
  for each row
  when (
    old.raw_user_meta_data is distinct from new.raw_user_meta_data
  )
  execute function public.sync_public_user_avatar_from_auth();

-- Backfill no auth.users (palaid kā postgres)
update public.users u
set avatar_url = sub.url
from (
  select
    au.id,
    coalesce(
      nullif(trim(au.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(trim(au.raw_user_meta_data ->> 'picture'), '')
    ) as url
  from auth.users au
) sub
where u.id = sub.id
  and (u.avatar_url is null or btrim(u.avatar_url) = '')
  and sub.url is not null
  and sub.url ~ '^https://';

-- SubTrack: globālie sistēmas parametri + noklusējuma attēlošanas preferences jaunajiem lietotājiem.
-- Palaid pēc 001 (un 006, ja vēl nav). Aizstāj `handle_new_user`, lai `display_preferences` aizpildās
-- no `system_settings.default_display_preferences` + iekšējā JSON bāze (saskaņā ar `DISPLAY_PREFERENCES_DEFAULTS`).

create table if not exists public.system_settings (
  id smallint primary key check (id = 1),
  system_name text not null default 'SubTrack',
  default_display_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.system_settings is
  'Viena rinda (id=1): produkta nosaukums un JSON ar noklusējuma display prefs jaunajiem lietotājiem.';

insert into public.system_settings (id, system_name, default_display_preferences)
values (1, 'SubTrack', '{}'::jsonb)
on conflict (id) do nothing;

alter table public.system_settings enable row level security;

drop policy if exists "system_settings_select_public" on public.system_settings;
create policy "system_settings_select_public"
  on public.system_settings for select
  using (true);

drop policy if exists "system_settings_update_admin" on public.system_settings;
create policy "system_settings_update_admin"
  on public.system_settings for update
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop trigger if exists system_settings_set_updated_at on public.system_settings;
create trigger system_settings_set_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Jauns Auth lietotājs: kopējam noklusējuma preferences no sistēmas
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

  insert into public.users (id, name, surname, email, is_admin, display_preferences)
  values (
    new.id,
    v_name,
    v_surname,
    coalesce(lower(trim(new.email)), ''),
    0,
    v_prefs
  );

  return new;
end;
$$;

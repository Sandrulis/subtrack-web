-- Reģistrācijas valsts (CDN / IP) Stripe reģionam (ES → EUR, UK → GBP, citur USD).
-- Palaid pēc 147_site_translations_users_last_seen_relative.sql.

alter table public.users
  add column if not exists registration_country char(2);

comment on column public.users.registration_country is
  'ISO 3166-1 alpha-2 valsts pie reģistrācijas (CDN galvene vai IP ģeolokācija); lietotājs nevar mainīt.';

create index if not exists users_registration_country_idx
  on public.users (registration_country);

-- Lietotājs nedrīkst mainīt reģistrācijas valsti caur sabiedrību klientu.
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
    and registration_country is not distinct from (
      select u.registration_country from public.users u where u.id = auth.uid()
    )
  );

comment on policy "users_update_own" on public.users is
  'Lietotājs drīkst labot neatkarīgos laukus; is_admin, email un registration_country nedrīkst mainīt.';

-- -----------------------------------------------------------------------------
-- Jauns lietotājs: valsts + norēķinu valūta no Auth metadata
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
  v_country char(2);
  v_billing_currency text;
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

  v_country :=
    upper(
      nullif(trim(new.raw_user_meta_data ->> 'registration_country'), '')
    )::char(2);

  if v_country is not null and length(trim(v_country::text)) <> 2 then
    v_country := null;
  end if;

  v_billing_currency :=
    upper(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'billing_currency'), ''),
        'EUR'
      )
    );

  if v_billing_currency not in ('EUR', 'GBP', 'USD') then
    v_billing_currency := 'EUR';
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
      'currency', v_billing_currency,
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
    avatar_url,
    registration_country
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
    v_avatar_url,
    v_country
  );

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Jauns auth.users → public.users; metadata: registration_country, billing_currency → display_preferences.currency.';

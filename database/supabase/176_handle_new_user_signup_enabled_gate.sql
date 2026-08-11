-- N1: signup_enabled=false bloķē arī tiešo Auth signUp / OAuth jauno kontu
-- (handle_new_user), ne tikai UI + signUpAction.
-- Palaid pēc 165_handle_new_user_geo_ui_language.sql un 166_system_settings_signup_enabled.sql.

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
  v_meta_lang text;
  v_trial_days integer := 0;
  v_grant_trial boolean := false;
  v_country char(2);
  v_billing_currency text;
  v_signup_enabled boolean := true;
begin
  select coalesce(s.signup_enabled, true)
    into v_signup_enabled
  from public.system_settings s
  where s.id = 1;

  if v_signup_enabled is false then
    raise exception 'signup_disabled'
      using errcode = 'P0001',
            hint = 'system_settings.signup_enabled=false';
  end if;

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

  v_meta_lang :=
    nullif(trim(lower(new.raw_user_meta_data ->> 'interface_language_code')), '');

  if v_meta_lang is not null
    and exists (
      select 1
      from public.languages l
      where lower(l.code) = v_meta_lang
    ) then
    v_ui_lang := v_meta_lang;
  else
    select coalesce(
      (select nullif(trim(lower(l.code)), '') from public.languages l where l.is_default limit 1),
      'lv'
    )
      into v_ui_lang;
  end if;

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
  'Jauns auth.users → public.users; bloķē, ja system_settings.signup_enabled=false; metadata: registration_country, billing_currency, interface_language_code.';

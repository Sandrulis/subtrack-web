-- SubTrack: maksas plāna režīms (cena, brīvā līmeņa limits, ieslēgšana) + lietotāja aktīvs plāns.
-- Palaid pēc `012_system_settings.sql` un `015_users_rls_protect_privileged_columns.sql`.

-- -----------------------------------------------------------------------------
-- system_settings
-- -----------------------------------------------------------------------------
alter table public.system_settings
  add column if not exists paid_plan_enabled boolean not null default false;

alter table public.system_settings
  add column if not exists paid_plan_price_eur numeric(10, 2) not null default 1.99;

alter table public.system_settings
  add column if not exists paid_plan_free_subscription_limit integer not null default 5;

alter table public.system_settings drop constraint if exists system_settings_free_limit_chk;
alter table public.system_settings
  add constraint system_settings_free_limit_chk check (
    paid_plan_free_subscription_limit >= 0
    and paid_plan_free_subscription_limit <= 100000
  );

comment on column public.system_settings.paid_plan_enabled is
  'Ja true, free līmenī drīkst līdz N abonementiem; lieko bloķē, ja nav paid_plan_active.';
comment on column public.system_settings.paid_plan_price_eur is
  'Maksas plāna cena EUR (marketing / landing).';
comment on column public.system_settings.paid_plan_free_subscription_limit is
  'Maksimālais abonementu skaits bez maksas plāna (ieskaitot).';

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
alter table public.users
  add column if not exists paid_plan_active boolean not null default false;

comment on column public.users.paid_plan_active is
  'Pēc apmaksas / admin: neierobežo abonementu skaitu. Klients nedrīkst pats ieslēgt (RLS).';

-- -----------------------------------------------------------------------------
-- RLS: paid_plan_active tikai nemaināms caur „sava profila’’ UPDATE
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
  );

comment on policy "users_update_own" on public.users is
  'Lietotājs drīkst labot neatkarīgos laukus; is_admin, email un paid_plan_active - nē.';

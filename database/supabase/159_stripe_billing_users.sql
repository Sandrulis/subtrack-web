-- SubTrack: Stripe norēķini – lietotāja plāna tips, termiņš, auto_atjaunošana, Stripe ID.
-- Palaid pēc database/supabase/158_security_advisor_categories_last_seen_feedback.sql.
-- VIP (`pro_vip`) paliek atsevišķi – admin dāvā Pro bez Stripe; `paid_plan_*` no maksājumiem.

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
alter table public.users
  add column if not exists paid_plan_type text;

alter table public.users
  add column if not exists paid_plan_period_end_at timestamptz;

alter table public.users
  add column if not exists paid_plan_auto_renew boolean not null default false;

alter table public.users
  add column if not exists stripe_customer_id text;

alter table public.users
  add column if not exists stripe_subscription_id text;

alter table public.users drop constraint if exists users_paid_plan_type_chk;
alter table public.users
  add constraint users_paid_plan_type_chk check (
    paid_plan_type is null
    or paid_plan_type in ('monthly', 'annual', 'lifetime')
  );

comment on column public.users.paid_plan_type is
  'Apmaksāts Pro plāns: monthly | annual | lifetime. NULL ja nav aktīva apmaksa (VIP/trial izmanto citus laukus).';
comment on column public.users.paid_plan_period_end_at is
  'Abonementa perioda beigas (Stripe current_period_end). Lifetime: parasti NULL.';
comment on column public.users.paid_plan_auto_renew is
  'Stripe abonements ar auto_atjaunošanu; lifetime un atcelts abonements – false.';
comment on column public.users.stripe_customer_id is
  'Stripe Customer ID; aizpilda serveris/webhook.';
comment on column public.users.stripe_subscription_id is
  'Stripe Subscription ID (monthly/annual); lifetime – NULL.';

create index if not exists users_paid_plan_type_idx on public.users (paid_plan_type)
where
  paid_plan_type is not null;

create index if not exists users_stripe_customer_id_idx on public.users (stripe_customer_id)
where
  stripe_customer_id is not null;

-- -----------------------------------------------------------------------------
-- RLS: billing lauki tikai serverim (webhook / service_role)
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
    and paid_plan_type is not distinct from (
      select u.paid_plan_type from public.users u where u.id = auth.uid()
    )
    and paid_plan_period_end_at is not distinct from (
      select u.paid_plan_period_end_at from public.users u where u.id = auth.uid()
    )
    and paid_plan_auto_renew is not distinct from (
      select u.paid_plan_auto_renew from public.users u where u.id = auth.uid()
    )
    and stripe_customer_id is not distinct from (
      select u.stripe_customer_id from public.users u where u.id = auth.uid()
    )
    and stripe_subscription_id is not distinct from (
      select u.stripe_subscription_id from public.users u where u.id = auth.uid()
    )
  );

comment on policy "users_update_own" on public.users is
  'Lietotājs drīkst labot neatkarīgos laukus; privileģētie un Stripe lauki – nē.';

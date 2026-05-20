-- Maksājumu žurnāls: katrs „Samaksāts” notikums (sinhronizācija starp ierīcēm, vēsture, dinamiskās summas).

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  paid_on date not null,
  amount_paid numeric(12, 2) not null,
  amount_scheduled numeric(12, 2) not null,
  period text not null,
  next_payment_date_after date,
  note text,
  created_at timestamptz not null default now(),
  constraint subscription_payments_amount_paid_chk check (amount_paid >= 0),
  constraint subscription_payments_amount_scheduled_chk check (amount_scheduled >= 0),
  constraint subscription_payments_period_chk check (
    period in ('monthly', 'yearly', 'weekly')
  )
);

create index if not exists subscription_payments_user_id_idx
  on public.subscription_payments (user_id);

create index if not exists subscription_payments_user_paid_on_idx
  on public.subscription_payments (user_id, paid_on);

create index if not exists subscription_payments_subscription_id_idx
  on public.subscription_payments (subscription_id);

comment on table public.subscription_payments is
  'Apmaksas notikumi (atzīmēts samaksāts). amount_scheduled = plānotā summa termiņā; amount_paid = faktiski samaksāts (nākotnē var atšķirties).';

comment on column public.subscription_payments.paid_on is
  'Apmaksātais termiņš (vecā next_payment_date pirms pārcelšanas).';

comment on column public.subscription_payments.amount_scheduled is
  'Plānotā summa šim termiņam (abonementa + aktīvo papildu rindu snapshot).';

comment on column public.subscription_payments.amount_paid is
  'Faktiski samaksātā summa (noklusējums = amount_scheduled; vēlāk var būt dinamiska).';

alter table public.subscription_payments enable row level security;

drop policy if exists "subscription_payments_select_own" on public.subscription_payments;
create policy "subscription_payments_select_own"
  on public.subscription_payments for select
  using (auth.uid() = user_id);

drop policy if exists "subscription_payments_insert_own" on public.subscription_payments;
create policy "subscription_payments_insert_own"
  on public.subscription_payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "subscription_payments_delete_own" on public.subscription_payments;
create policy "subscription_payments_delete_own"
  on public.subscription_payments for delete
  using (auth.uid() = user_id);

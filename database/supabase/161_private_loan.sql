-- Privātais aizdevums: pamatsumma, kopējā atmaksa, maksājumu grafiks (JSON), summa balstīta progress josla.

alter table public.subscriptions
  add column if not exists is_private_loan boolean not null default false;

alter table public.subscriptions
  add column if not exists loan_principal numeric(12, 2);

alter table public.subscriptions
  add column if not exists loan_total_repay numeric(12, 2);

alter table public.subscriptions
  add column if not exists loan_payments jsonb not null default '[]'::jsonb;

comment on column public.subscriptions.is_private_loan is
  'Privāts aizdevums ar maksājumu grafiku un summas progresu (ne periodisks abonements).';

comment on column public.subscriptions.loan_principal is
  'Aizņemtā summa (informatīvi).';

comment on column public.subscriptions.loan_total_repay is
  'Kopējā atmaksājamā summa; progress josla = samaksāts / šī summa.';

comment on column public.subscriptions.loan_payments is
  'Maksājumu grafiks: [{ id, date, amount, paidOn|null }].';

alter table public.subscriptions
  drop constraint if exists subscriptions_period_chk;

alter table public.subscriptions
  add constraint subscriptions_period_chk check (
    period in ('monthly', 'yearly', 'weekly', 'once')
  );

alter table public.subscription_payments
  drop constraint if exists subscription_payments_period_chk;

alter table public.subscription_payments
  add constraint subscription_payments_period_chk check (
    period in ('monthly', 'yearly', 'weekly', 'once')
  );

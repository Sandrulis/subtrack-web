-- Žurnāls: viens kavēta maksājuma atgādinājums dienā uz abonementu (cron).

create table if not exists public.email_reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  reminder_type text not null default 'overdue',
  sent_on date not null default (current_date),
  created_at timestamptz not null default now(),
  constraint email_reminder_log_type_chk check (reminder_type in ('overdue')),
  constraint email_reminder_log_unique_per_day unique (
    user_id,
    subscription_id,
    reminder_type,
    sent_on
  )
);

create index if not exists email_reminder_log_sent_on_idx
  on public.email_reminder_log (sent_on);

comment on table public.email_reminder_log is
  'Transakciju e-pastu sūtīšanas žurnāls (deduplikācija). Tikai serveris (service_role).';

alter table public.email_reminder_log enable row level security;

-- Skaidras „deny” politikas (Advisor); cron izmanto service_role (RLS apiet).
drop policy if exists "email_reminder_log_deny_anon" on public.email_reminder_log;
create policy "email_reminder_log_deny_anon"
  on public.email_reminder_log for all
  to anon
  using (false)
  with check (false);

drop policy if exists "email_reminder_log_deny_authenticated" on public.email_reminder_log;
create policy "email_reminder_log_deny_authenticated"
  on public.email_reminder_log for all
  to authenticated
  using (false)
  with check (false);

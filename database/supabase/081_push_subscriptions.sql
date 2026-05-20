-- Web Push abonementi (PWA / pārlūks) un sūtīšanas žurnāls (deduplikācija).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_unique unique (endpoint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

comment on table public.push_subscriptions is
  'Web Push endpointi uz lietotāju (vairākas ierīces).';

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.push_notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reminder_type text not null default 'payment_digest',
  sent_on date not null default (current_date),
  created_at timestamptz not null default now(),
  constraint push_notification_log_type_chk check (
    reminder_type in ('payment_digest')
  ),
  constraint push_notification_log_unique_per_day unique (
    user_id,
    reminder_type,
    sent_on
  )
);

create index if not exists push_notification_log_sent_on_idx
  on public.push_notification_log (sent_on);

comment on table public.push_notification_log is
  'Push digest žurnāls: viens kopsavilkums dienā uz lietotāju. Tikai serveris (service_role).';

alter table public.push_notification_log enable row level security;

drop policy if exists "push_notification_log_deny_anon" on public.push_notification_log;
create policy "push_notification_log_deny_anon"
  on public.push_notification_log for all
  to anon
  using (false)
  with check (false);

drop policy if exists "push_notification_log_deny_authenticated" on public.push_notification_log;
create policy "push_notification_log_deny_authenticated"
  on public.push_notification_log for all
  to authenticated
  using (false)
  with check (false);

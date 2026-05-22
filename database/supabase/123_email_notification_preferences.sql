-- Lietotāja e-pasta paziņojumu preferences + paplašināts email_reminder_log.

alter table public.users
  add column if not exists email_notification_preferences jsonb not null default jsonb_build_object(
    'due_today', true,
    'weekly', true,
    'trial_end', true
  );

comment on column public.users.email_notification_preferences is
  'E-pasta paziņojumi: due_today, weekly, trial_end (boolean).';

-- subscription_id var būt NULL (nedēļas kopsavilkums, izmēģinājuma beigas).
alter table public.email_reminder_log
  alter column subscription_id drop not null;

alter table public.email_reminder_log
  drop constraint if exists email_reminder_log_type_chk;

alter table public.email_reminder_log
  add constraint email_reminder_log_type_chk check (
    reminder_type in (
      'overdue',
      'due_today',
      'weekly_summary',
      'trial_end_3d',
      'trial_end_1d',
      'trial_end_0d'
    )
  );

alter table public.email_reminder_log
  drop constraint if exists email_reminder_log_unique_per_day;

create unique index if not exists email_reminder_log_sub_daily
  on public.email_reminder_log (user_id, subscription_id, reminder_type, sent_on)
  where subscription_id is not null;

create unique index if not exists email_reminder_log_user_daily
  on public.email_reminder_log (user_id, reminder_type, sent_on)
  where subscription_id is null;

-- Win-back e-pasti (7 / 30 dienas bez aktivitātes) + lietotāja prefs.

alter table public.users
  alter column email_notification_preferences set default jsonb_build_object(
    'due_today', true,
    'weekly', true,
    'trial_end', true,
    'win_back', true
  );

comment on column public.users.email_notification_preferences is
  'E-pasta paziņojumi: due_today, weekly, trial_end, win_back (boolean).';

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
      'trial_end_0d',
      'win_back_7d',
      'win_back_30d'
    )
  );

-- Esošiem lietotājiem: win_back noklusējums ieslēgts, ja atslēga trūkst.
update public.users
set email_notification_preferences =
  email_notification_preferences || jsonb_build_object('win_back', true)
where (email_notification_preferences->>'win_back') is null;

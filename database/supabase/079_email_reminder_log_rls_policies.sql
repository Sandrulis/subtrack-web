-- Novērš Supabase Advisor "RLS Enabled No Policy" uz email_reminder_log.
-- Piekļuve tikai serverim (service_role cron); anon/authenticated – skaidri aizliegts.
-- Palaid pēc 052_email_reminder_log.sql.

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

comment on policy "email_reminder_log_deny_anon" on public.email_reminder_log is
  'E-pasta žurnāls – tikai service_role (cron); anon nav piekļuves.';
comment on policy "email_reminder_log_deny_authenticated" on public.email_reminder_log is
  'E-pasta žurnāls – tikai service_role (cron); autentificēti lietotāji nelasa/neraksta.';

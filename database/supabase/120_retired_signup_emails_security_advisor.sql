-- Security Advisor: RLS politikas + REVOKE uz trigger funkciju.
-- Palaid pēc 119_retired_signup_emails.sql (vai ja 119 jau palaists bez šīm rindām).

-- retired_signup_emails (kanoniskais nosaukums)
drop policy if exists "retired_signup_emails_deny_anon" on public.retired_signup_emails;
create policy "retired_signup_emails_deny_anon"
  on public.retired_signup_emails for all
  to anon
  using (false)
  with check (false);

drop policy if exists "retired_signup_emails_deny_authenticated" on public.retired_signup_emails;
create policy "retired_signup_emails_deny_authenticated"
  on public.retired_signup_emails for all
  to authenticated
  using (false)
  with check (false);

revoke all on function public.retire_signup_email_on_auth_user_delete() from public;
revoke all on function public.retire_signup_email_on_auth_user_delete() from anon;
revoke all on function public.retire_signup_email_on_auth_user_delete() from authenticated;

-- Ja 119 palaists ar citu nosaukumu (piem. resend_signup_*)
do $$
begin
  if exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'resend_signup_emails'
  ) then
    execute 'drop policy if exists "resend_signup_emails_deny_anon" on public.resend_signup_emails';
    execute '
      create policy "resend_signup_emails_deny_anon"
        on public.resend_signup_emails for all
        to anon
        using (false)
        with check (false)';
    execute 'drop policy if exists "resend_signup_emails_deny_authenticated" on public.resend_signup_emails';
    execute '
      create policy "resend_signup_emails_deny_authenticated"
        on public.resend_signup_emails for all
        to authenticated
        using (false)
        with check (false)';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'resend_signup_email_on_auth_user_delete'
  ) then
    execute 'revoke all on function public.resend_signup_email_on_auth_user_delete() from public';
    execute 'revoke all on function public.resend_signup_email_on_auth_user_delete() from anon';
    execute 'revoke all on function public.resend_signup_email_on_auth_user_delete() from authenticated';
  end if;
end
$$;

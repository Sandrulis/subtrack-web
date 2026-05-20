-- Novērš Supabase Advisor "Security Definer View" (noņem system_settings_public).
-- email_templates -> atsevišķa tabula ar admin-only RLS; system_settings atkal publiski lasāms.
-- Palaid pēc 076_system_settings_public_read.sql (vai vietā, ja 076 vēl nav palaists).

-- -----------------------------------------------------------------------------
-- Sensitīvie e-pasta šabloni (tikai admin SELECT/UPDATE)
-- -----------------------------------------------------------------------------
create table if not exists public.system_settings_email_templates (
  id smallint primary key check (id = 1),
  email_templates jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.system_settings_email_templates is
  'Pielāgoti e-pasta šabloni (/admin/email-design); nav anon SELECT.';

insert into public.system_settings_email_templates (id, email_templates)
select 1, coalesce(s.email_templates, '{}'::jsonb)
from public.system_settings s
where s.id = 1
on conflict (id) do update set
  email_templates = excluded.email_templates;

insert into public.system_settings_email_templates (id, email_templates)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.system_settings_email_templates enable row level security;

drop policy if exists "system_settings_email_templates_select_admin" on public.system_settings_email_templates;
create policy "system_settings_email_templates_select_admin"
  on public.system_settings_email_templates for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "system_settings_email_templates_update_admin" on public.system_settings_email_templates;
create policy "system_settings_email_templates_update_admin"
  on public.system_settings_email_templates for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "system_settings_email_templates_insert_admin" on public.system_settings_email_templates;
create policy "system_settings_email_templates_insert_admin"
  on public.system_settings_email_templates for insert
  to authenticated
  with check (public.current_user_is_admin() and id = 1);

drop trigger if exists system_settings_email_templates_set_updated_at on public.system_settings_email_templates;
create trigger system_settings_email_templates_set_updated_at
  before update on public.system_settings_email_templates
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Noņem SECURITY DEFINER skatu; atjauno publisko SELECT uz system_settings
-- -----------------------------------------------------------------------------
drop view if exists public.system_settings_public;

drop policy if exists "system_settings_select_admin" on public.system_settings;
drop policy if exists "system_settings_select_public" on public.system_settings;
create policy "system_settings_select_public"
  on public.system_settings for select
  using (true);

alter table public.system_settings drop column if exists email_templates;

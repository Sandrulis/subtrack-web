-- SubTrack: integrāciju karodziņas ( `/admin/integrations` ) – tehniska atslēga, cilvēkam lasāms nosaukums, iesl./izsl.
-- Palaid pēc pamata shēmas (001) un `current_user_is_admin()` (005/003).
-- Ja no API jāizmanto “vai šī integrācija ir aktīva”, tabula lasāma arī bez admin sesijas (`SELECT USING (true)`).

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid (),
  integration_key text not null,
  label text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint integrations_key_trim_chk check (
    integration_key = btrim(integration_key)
    and length(integration_key) between 2 and 64
  ),
  constraint integrations_key_fmt_chk check (
    integration_key ~ '^[a-z][a-z0-9_]+$'
  ),
  constraint integrations_label_trim_chk check (
    label = btrim(label) and char_length(label) between 1 and 160
  )
);

comment on table public.integrations is
  'Lietošanas funkciju un ārējo pakalpojumu karodziņas – `integration_key` programmas līmenī (piem., stripe_webhook), `enabled` no admin paneļa.';

drop trigger if exists integrations_set_updated_at on public.integrations;
create trigger integrations_set_updated_at
before update on public.integrations for each row
execute function public.set_updated_at ();

drop index if exists integrations_key_lower_uidx;
create unique index integrations_key_lower_uidx on public.integrations (lower (integration_key));

create index if not exists integrations_updated_idx on public.integrations (updated_at desc);

alter table public.integrations enable row level security;

drop policy if exists "integrations_select_public" on public.integrations;
create policy "integrations_select_public" on public.integrations for select using (true);

drop policy if exists "integrations_insert_admin" on public.integrations;
create policy "integrations_insert_admin"
on public.integrations for insert
with
  check (public.current_user_is_admin ());

drop policy if exists "integrations_update_admin" on public.integrations;
create policy "integrations_update_admin"
on public.integrations for update
using (public.current_user_is_admin ())
with
  check (public.current_user_is_admin ());

drop policy if exists "integrations_delete_admin" on public.integrations;
create policy "integrations_delete_admin" on public.integrations for delete using (
  public.current_user_is_admin ()
);

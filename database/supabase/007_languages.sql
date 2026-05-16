-- Programmas valodu saraksts (`/admin/languages`): CRUD tikai administratoriem (`current_user_is_admin()`).
-- Palaid pēc iepriekšējiem migrācijas soļiem (piem. 006_*).
-- Ja tabula jau pastāvēja no testiem, atkārtots palaidšana drošs (`if not exists` / `drop policy if exists`).

create table if not exists public.languages (
  id uuid primary key default gen_random_uuid (),
  code text not null,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint languages_code_trim_chk check (code = btrim(code) and length(code) between 2 and 24),
  constraint languages_code_fmt_chk check (
    code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint languages_label_trim_chk check (
    label = btrim(label) and char_length(label) between 1 and 120
  ),
  constraint languages_sort_chk check (sort_order >= 0)
);

comment on table public.languages is
  'Lietojumprogrammas lokāļu kodu saraksts; UI nosaukums parasti kā valodas pašnosaukums (English, Deutsch, Latviešu u.tml.).';

drop trigger if exists languages_set_updated_at on public.languages;
create trigger languages_set_updated_at
before update on public.languages for each row
execute function public.set_updated_at ();

drop index if exists languages_code_lower_uidx;
create unique index languages_code_lower_uidx on public.languages (lower (code));

create index if not exists languages_sort_idx on public.languages (sort_order, code);

alter table public.languages enable row level security;

drop policy if exists "languages_select_admin" on public.languages;
create policy "languages_select_admin" on public.languages for
select using (public.current_user_is_admin ());

drop policy if exists "languages_insert_admin" on public.languages;
create policy "languages_insert_admin" on public.languages for insert
with
  check (public.current_user_is_admin ());

drop policy if exists "languages_update_admin" on public.languages;
create policy "languages_update_admin"
on public.languages for
update using (public.current_user_is_admin ())
with
  check (public.current_user_is_admin ());

drop policy if exists "languages_delete_admin" on public.languages;
create policy "languages_delete_admin" on public.languages for delete using (public.current_user_is_admin ());

-- ---------------------------------------------------------------------------
-- Noklusētās valodas (katras nosaukums tās rakstību tradīcijā / autonyms)
-- ---------------------------------------------------------------------------
insert into
  public.languages (code, label, sort_order)
select
  v.code,
  v.label,
  v.sort_order
from
  (
    values
      ('en', 'English', 10),
      ('fr', 'Français', 20),
      ('de', 'Deutsch', 30),
      ('es', 'Español', 40),
      ('pt', 'Português', 50),
      ('lv', 'Latviešu', 60),
      ('ru', 'Русский', 70)
  ) as v(code, label, sort_order)
where not exists (
  select
    1
  from public.languages l
  where lower(l.code) = lower(v.code)
);

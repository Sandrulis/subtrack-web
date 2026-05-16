-- Tulkojamu atslēgu vērtības pēc `languages.code`; CRUD tikai administratoriem (`current_user_is_admin()`).
-- Palaid pēc `007_languages.sql` un citiem priekštečiem.
-- `translation_key` glabājas normalizētā veidā: `lower(trim(..))`, lai `upsert` var izmantot unikālo indeksu uz kolonnām.

create table if not exists public.site_translations (
  id uuid primary key default gen_random_uuid (),
  translation_key text not null,
  locale text not null,
  value text not null default '',
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint site_translations_locale_fmt_chk check (
    locale = btrim(lower(locale))
      and length(locale) between 2
      and 24
      and locale ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint site_translations_key_fmt_chk check (
    translation_key = lower(btrim (translation_key))
      and length(translation_key) between 1
      and 200
      and translation_key ~ '^[a-z0-9][a-z0-9_.]*$'
  ),
  constraint site_translations_value_len_chk check (char_length(value) <= 10000),
  constraint site_translations_key_locale_uniq unique (translation_key, locale)
);

comment on table public.site_translations is
  'Lokalizētas virknes; `locale` sakrīt ar `public.languages.code` ( mazie ); `translation_key` - vienota `lower`/`trim` tulkošanas atslēga (piem. `auth.login`).';

drop trigger if exists site_translations_set_updated_at on public.site_translations;
create trigger site_translations_set_updated_at before
update on public.site_translations for each row execute function public.set_updated_at ();

create index if not exists site_translations_key_prefix_idx on public.site_translations (translation_key);

alter table public.site_translations enable row level security;

drop policy if exists "site_translations_select_admin" on public.site_translations;
create policy "site_translations_select_admin" on public.site_translations for select
using (public.current_user_is_admin ());

drop policy if exists "site_translations_insert_admin" on public.site_translations;
create policy "site_translations_insert_admin" on public.site_translations for insert
with check (public.current_user_is_admin ());

drop policy if exists "site_translations_update_admin" on public.site_translations;
create policy "site_translations_update_admin"
on public.site_translations for
update using (public.current_user_is_admin ())
with check (public.current_user_is_admin ());

drop policy if exists "site_translations_delete_admin" on public.site_translations;
create policy "site_translations_delete_admin" on public.site_translations for delete using (
  public.current_user_is_admin ()
);

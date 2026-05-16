-- SubTrack: lietotāja attēlošanas preferences (iestatījumu forma)
-- Palaid pēc 001. Kolonna nullable: null = vēl nav saglabāts serverī; klients var lietot localStorage.

alter table public.users
  add column if not exists display_preferences jsonb;

comment on column public.users.display_preferences is
  'JSONB: UI prefs (interface_language_code = languages.code, currency, datumu/laika formāti, TZ, nedēļas starts). Null = nav sinhronizēts.';

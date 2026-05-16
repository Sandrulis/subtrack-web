-- SubTrack: lietotāja attēlošanas preferences (iestatījumu forma)
-- Palaid pēc 001. Kolonna nullable: null = vēl nav saglabāts serverī; klients var lietot localStorage.

alter table public.users
  add column if not exists display_preferences jsonb;

comment on column public.users.display_preferences is
  'UI preferences (currency, date_order, date_sep, time_format, time_sep, timezone, week_start). Null = nav sinhronizēts.';

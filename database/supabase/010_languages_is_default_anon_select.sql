-- Valodu noklusējums pirmajai ierašanās reizei (bez sīkdatnes / lietotāja prefs) un anon lasīšana katalogam (SSR).
-- Palaid pēc 007_* un 009_*. Nepieciešams, lai `getLanguagesCatalog` un `<html lang>` varētu nolasīt `is_default` bez sesijas.

alter table public.languages
  add column if not exists is_default boolean not null default false;

comment on column public.languages.is_default is
  'Ja true, šis languages.code ir sistēmas noklusējums jaunajiem apmeklētājiem (pirms lietotāja izvēles un Accept-Language saskaņošanas). Tieši viena rinda ar true.';

drop index if exists languages_one_default_true_uidx;
create unique index languages_one_default_true_uidx on public.languages ((1))
where
  (is_default is true);

-- Vienu reizi ieskata: latviešu kā noklusējums (atbilst iepriekšējam koda noklusējumam).
update public.languages
set
  is_default = (lower(code) = 'lv')
where
  true;

-- Ja lv nav tabulā, izvēlamies vienu kandidātu pēc sort_order, tad pēc koda.
update public.languages l
set
  is_default = true
where
  l.id = (
    select
      id
    from
      public.languages
    where
      not exists (
        select
          1
        from
          public.languages d
        where
          d.is_default is true
      )
    order by
      sort_order,
      code
    limit
      1
  );

-- Anon skati var lasīt valodu katalogu (tikai SELECT; pārējās RLS paliek).
drop policy if exists "languages_select_anon" on public.languages;

create policy "languages_select_anon" on public.languages for
select to anon using (true);

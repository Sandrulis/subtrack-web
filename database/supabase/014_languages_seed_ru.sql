-- Krievu valoda: sēkla `public.languages` (admin / tulkošanu kolonnas).
-- Palaid pēc `007_languages.sql` (ja `ru` jau eksistē, neko nemaina).

insert into
  public.languages (code, label, sort_order)
select
  v.code,
  v.label,
  v.sort_order
from
  (
    values
      ('ru', 'Русский', 70)
  ) as v(code, label, sort_order)
where not exists (
  select
    1
  from public.languages l
  where lower(l.code) = lower(v.code)
);

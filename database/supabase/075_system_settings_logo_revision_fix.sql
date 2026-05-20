-- Labo logo_revision, ja iepriekšējais kods ierakstīja Date.now() (ārpus integer diapazona).
-- Palaid vienreiz pēc 071, ja redzēji kļūdu "out of range for type integer".

update public.system_settings
set logo_revision = 1
where id = 1
  and logo_revision > 2147483647;

-- Ielogotiem lietotājiem atļaut lasīt valodu katalogu (piem., /settings saskarnes valodas atlase).
-- Palaid pēc 007_languages.sql. Admin politikas joprojām attiecas; šī ir papildus SELECT līnija.

drop policy if exists "languages_select_authenticated" on public.languages;

create policy "languages_select_authenticated"
  on public.languages for select
  to authenticated
  using (true);

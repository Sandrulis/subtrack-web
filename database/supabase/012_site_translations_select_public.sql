-- Publiski nolasīt `site_translations` ar anon atslēgu (UI virkņu lasīšanai SSR / kešam bez admin sesijas).
-- Administratorskās izmaiņas joprojām tikai adminiem (INSERT / UPDATE / DELETE paliek kā `011_*`).

drop policy if exists "site_translations_select_public" on public.site_translations;

create policy "site_translations_select_public"
  on public.site_translations
  as permissive
  for select
  to anon, authenticated
  using (true);

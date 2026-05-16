-- Aizsargs: līdz šīm politika users_update_own ļāva papildinājāt paša rindā jebkurus laukus,
-- kur USING/WITH CHECK apmierināja vien auth.uid() = id. Tas nozīmēja, ka klients ar anon key
-- un derīgu sesiju varētu iestatīt is_admin > 0 (un mainīt email), ja nav citu šķēršļu.
--
-- Papildināts WITH CHECK: is_admin un email nedrīkst mainīt caur šo „sava profila’’ politiku –
-- apkārtējā uzvedība salīdzina NEW vērtības ar eksistējošajām kolonnām (vēl līdz COMMIT līdzīgā uzvedībā –
-- Postgres WITH CHECK laikā zemīkvēri uz tabulu redz līdzināšanu pirms uzlabojuma tai rindā).
--
-- ADMIN TIESĪBU PĀRVADĪŠANA / E-PASTU SINHRONIZĀCIJA: realizējamas Security Definer RPC vai
-- platformas / Supabase vadības ceļiem, nevis anon REST UPDATE uz šiem laukiem.
--
-- Palaid pēc iepriekšējām migrācijām.

drop policy if exists "users_update_own" on public.users;

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin is not distinct from (
      select u.is_admin from public.users u where u.id = auth.uid()
    )
    and email is not distinct from (
      select u.email from public.users u where u.id = auth.uid()
    )
  );

comment on policy "users_update_own" on public.users is
  'Lietotājs drīkst labot tikai neatkarīgos laukus (name, surname, display_preferences u.tml.); is_admin un email nedrīkst mainīt caur sabiedrību Supabase klientu.';

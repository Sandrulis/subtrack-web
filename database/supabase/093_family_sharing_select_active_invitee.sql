-- Partneris / uzaicinātais redz active saites arī tad, ja SELECT balstās uz invite_email (ne tikai pending).
-- Papildina 084; novērš tukšu /family-sharing, ja DB ir active, bet RLS atgrieza 0 rindas.

drop policy if exists "family_sharing_links_select_involved" on public.family_sharing_links;
create policy "family_sharing_links_select_involved"
on public.family_sharing_links for select
using (
  owner_user_id = auth.uid ()
  or partner_user_id = auth.uid ()
  or lower(btrim(invite_email)) = lower(
    btrim(
      coalesce(
        (select u.email from public.users u where u.id = auth.uid ()),
        auth.jwt () ->> 'email',
        ''
      )
    )
  )
);

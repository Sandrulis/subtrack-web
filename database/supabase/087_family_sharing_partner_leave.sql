-- Partneris var pārtraukt aktīvu dalību (status -> revoked).
-- Papildina 084 (tikai owner update) un 086.

drop policy if exists "family_sharing_links_update_partner_leave" on public.family_sharing_links;
create policy "family_sharing_links_update_partner_leave"
on public.family_sharing_links for update
using (
  partner_user_id = auth.uid ()
  and status = 'active'
)
with
  check (
    partner_user_id = auth.uid ()
    and status = 'revoked'
  );

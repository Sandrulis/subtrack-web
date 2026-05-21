-- Partneris var mainīt combine_in_totals aktīvai saitei (summēt kopīgos izdevumus savā panelī).
-- Papildina 087 (leave -> revoked).

drop policy if exists "family_sharing_links_update_partner_active" on public.family_sharing_links;
create policy "family_sharing_links_update_partner_active"
on public.family_sharing_links for update
using (
  partner_user_id = auth.uid ()
  and status = 'active'
)
with
  check (
    partner_user_id = auth.uid ()
    and status = 'active'
  );

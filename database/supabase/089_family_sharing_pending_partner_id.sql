-- Pending uzaicinājumi ar iepriekš zināmu partner_user_id (POST iestata ID).
-- Papildina 084 accept politiku: partneris var pieņemt, ja partner_user_id = auth.uid().

update public.family_sharing_links l
set partner_user_id = u.id
from public.users u
where
  l.status = 'pending'
  and l.partner_user_id is null
  and lower(trim(u.email)) = l.invite_email;

drop policy if exists "family_sharing_links_update_accept" on public.family_sharing_links;
create policy "family_sharing_links_update_accept"
on public.family_sharing_links for update
using (
  status = 'pending'
  and (
    partner_user_id = auth.uid ()
    or (
      partner_user_id is null
      and lower(invite_email) = (
        select lower(u.email)
        from public.users u
        where u.id = auth.uid ()
      )
    )
  )
)
with
  check (
    status = 'active'
    and partner_user_id = auth.uid ()
  );

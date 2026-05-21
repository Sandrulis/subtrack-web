-- Uzaicinātais var noraidīt pending uzaicinājumu (status -> revoked).

drop policy if exists "family_sharing_links_update_decline" on public.family_sharing_links;
create policy "family_sharing_links_update_decline"
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
  check (status = 'revoked');

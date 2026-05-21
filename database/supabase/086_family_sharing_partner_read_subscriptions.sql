-- Partneris (uzaicinātais) var lasīt uzaicinātāja (owner) abonementus, ja saite ir active.
-- Papildina 084: iepriekš tikai owner -> partner SELECT.

drop policy if exists "subscriptions_select_family_shared" on public.subscriptions;
create policy "subscriptions_select_family_shared"
on public.subscriptions for select
using (
  auth.uid () = user_id
  or exists (
    select 1
    from public.family_sharing_links l
    where
      l.status = 'active'
      and (
        (
          l.owner_user_id = auth.uid ()
          and l.partner_user_id = subscriptions.user_id
        )
        or (
          l.partner_user_id = auth.uid ()
          and l.owner_user_id = subscriptions.user_id
        )
      )
  )
);

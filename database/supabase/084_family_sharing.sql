-- SubTrack: ģimenes dalīšana (family sharing) – uzaicinājumi, kopīga izdevumu lasīšana, kopsavilkumu slēdzis.
-- Pēc 024_integrations.sql. Admin: integration_key `family_sharing`.

insert into public.integrations (integration_key, label, enabled)
select 'family_sharing', 'Family sharing', false
where not exists (
  select 1 from public.integrations where lower(integration_key) = 'family_sharing'
);

create table if not exists public.family_sharing_links (
  id uuid primary key default gen_random_uuid (),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  partner_user_id uuid references auth.users (id) on delete set null,
  invite_email text not null,
  status text not null default 'pending',
  partner_display_color text not null default '#f59e0b',
  combine_in_totals boolean not null default false,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  accepted_at timestamptz,
  constraint family_sharing_links_status_chk check (
    status in ('pending', 'active', 'revoked')
  ),
  constraint family_sharing_links_email_trim_chk check (
    invite_email = lower(btrim(invite_email))
    and invite_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  constraint family_sharing_links_color_chk check (
    partner_display_color ~ '^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$'
  )
);

comment on table public.family_sharing_links is
  'Lietotājs (owner) uzaicina partneri pa e-pastu; aktīvs saites ļauj owner lasīt partnera subscriptions un rādīt tos panelī.';

create unique index if not exists family_sharing_links_owner_email_uidx
  on public.family_sharing_links (owner_user_id, invite_email)
  where status in ('pending', 'active');

create unique index if not exists family_sharing_links_owner_partner_uidx
  on public.family_sharing_links (owner_user_id, partner_user_id)
  where partner_user_id is not null and status = 'active';

create index if not exists family_sharing_links_partner_idx
  on public.family_sharing_links (partner_user_id)
  where partner_user_id is not null;

create index if not exists family_sharing_links_invite_email_idx
  on public.family_sharing_links (invite_email)
  where status = 'pending';

drop trigger if exists family_sharing_links_set_updated_at on public.family_sharing_links;
create trigger family_sharing_links_set_updated_at
before update on public.family_sharing_links for each row
execute function public.set_updated_at ();

alter table public.family_sharing_links enable row level security;

drop policy if exists "family_sharing_links_select_involved" on public.family_sharing_links;
create policy "family_sharing_links_select_involved"
on public.family_sharing_links for select
using (
  owner_user_id = auth.uid ()
  or partner_user_id = auth.uid ()
  or (
    status = 'pending'
    and lower(invite_email) = (
      select lower(u.email)
      from public.users u
      where u.id = auth.uid ()
    )
  )
);

drop policy if exists "family_sharing_links_insert_owner" on public.family_sharing_links;
create policy "family_sharing_links_insert_owner"
on public.family_sharing_links for insert
with
  check (owner_user_id = auth.uid ());

drop policy if exists "family_sharing_links_update_owner" on public.family_sharing_links;
create policy "family_sharing_links_update_owner"
on public.family_sharing_links for update
using (owner_user_id = auth.uid ())
with
  check (owner_user_id = auth.uid ());

drop policy if exists "family_sharing_links_update_accept" on public.family_sharing_links;
create policy "family_sharing_links_update_accept"
on public.family_sharing_links for update
using (
  status = 'pending'
  and partner_user_id is null
  and lower(invite_email) = (
    select lower(u.email)
    from public.users u
    where u.id = auth.uid ()
  )
)
with
  check (
    status = 'active'
    and partner_user_id = auth.uid ()
  );

drop policy if exists "family_sharing_links_delete_owner" on public.family_sharing_links;
create policy "family_sharing_links_delete_owner"
on public.family_sharing_links for delete
using (owner_user_id = auth.uid ());

-- Owner ar aktīvu saiti var lasīt partnera abonementus (tikai SELECT).
drop policy if exists "subscriptions_select_family_shared" on public.subscriptions;
create policy "subscriptions_select_family_shared"
on public.subscriptions for select
using (
  auth.uid () = user_id
  or exists (
    select 1
    from public.family_sharing_links l
    where
      l.owner_user_id = auth.uid ()
      and l.partner_user_id = subscriptions.user_id
      and l.status = 'active'
  )
);

-- SubTrack: Pro VIP (admin dāvināta Pro piekļuve bez apmaksas).
-- Pēc database/supabase/027_paid_plan.sql.
-- Pieeja kā Pro: paid_plan_active OR pro_vip (skat. app kodu).

alter table public.users
  add column if not exists pro_vip boolean not null default false;

comment on column public.users.pro_vip is
  'Admin: Pro līmenis bez maksas. Klients nedrīkst pats mainīt (RLS).';

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
    and paid_plan_active is not distinct from (
      select u.paid_plan_active from public.users u where u.id = auth.uid()
    )
    and pro_vip is not distinct from (
      select u.pro_vip from public.users u where u.id = auth.uid()
    )
  );

comment on policy "users_update_own" on public.users is
  'Lietotājs drīkst labot neatkarīgos laukus; is_admin, email, paid_plan_active un pro_vip - nē.';

create or replace function public.admin_set_user_pro_vip(
  target_user_id uuid,
  enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  if auth.uid() is null then
    raise exception 'admin_set_user_pro_vip_unauth';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.is_admin > 0
  ) then
    raise exception 'admin_set_user_pro_vip_forbidden';
  end if;

  update public.users u
  set pro_vip = enabled
  where u.id = target_user_id;
  get diagnostics affected = row_count;

  if affected = 0 then
    raise exception 'admin_set_user_pro_vip_missing_user';
  end if;
end;
$$;

comment on function public.admin_set_user_pro_vip(uuid, boolean) is
  'SECURITY DEFINER: admins (is_admin>0) can toggle Pro VIP for any user row.';

revoke all on function public.admin_set_user_pro_vip(uuid, boolean) from public;
grant execute on function public.admin_set_user_pro_vip(uuid, boolean) to authenticated;

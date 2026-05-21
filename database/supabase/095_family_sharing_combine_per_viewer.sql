-- Katram lietotājam savs „saskaitīt kopā” slēdzis (owner / partner neatkarīgi).
-- Aizstāj vienu combine_in_totals. Papildina 094.

alter table public.family_sharing_links
  add column if not exists owner_combine_in_totals boolean not null default false,
  add column if not exists partner_combine_in_totals boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where
      table_schema = 'public'
      and table_name = 'family_sharing_links'
      and column_name = 'combine_in_totals'
  ) then
    update public.family_sharing_links
    set
      owner_combine_in_totals = combine_in_totals,
      partner_combine_in_totals = combine_in_totals;

    alter table public.family_sharing_links
    drop column combine_in_totals;
  end if;
end
$$;

create or replace function public.family_sharing_links_guard_update ()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid ();
  invitee_email_match boolean;
  old_st text;
  new_st text;
begin
  if uid is null then
    return new;
  end if;

  old_st := lower(btrim(old.status));
  new_st := lower(btrim(new.status));

  if new.id is distinct from old.id then
    raise exception 'family_sharing_links: id change forbidden';
  end if;
  if new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'family_sharing_links: owner change forbidden';
  end if;
  if new.invite_email is distinct from old.invite_email then
    raise exception 'family_sharing_links: invite_email change forbidden';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'family_sharing_links: created_at change forbidden';
  end if;

  invitee_email_match := lower(btrim(old.invite_email)) = lower(
    btrim(
      coalesce(
        (select u.email from public.users u where u.id = uid),
        auth.jwt () ->> 'email',
        ''
      )
    )
  );

  if new.partner_user_id is distinct from old.partner_user_id then
    if not (
      old_st = 'pending'
      and new_st = 'active'
      and new.partner_user_id = uid
    ) then
      raise exception 'family_sharing_links: partner_user_id change forbidden';
    end if;
  end if;

  if new.accepted_at is distinct from old.accepted_at then
    if not (
      old_st = 'pending'
      and new_st = 'active'
      and new.partner_user_id = uid
    ) then
      raise exception 'family_sharing_links: accepted_at change forbidden';
    end if;
  end if;

  if new_st is distinct from old_st then
    if old.owner_user_id = uid and new_st = 'revoked' and old_st in ('pending', 'active') then
      null;
    elsif old.partner_user_id = uid and new_st = 'revoked' and old_st = 'active' then
      null;
    elsif
      old_st = 'pending'
      and new_st = 'revoked'
      and (
        old.partner_user_id = uid
        or (old.partner_user_id is null and invitee_email_match)
      )
    then
      null;
    elsif old_st = 'pending' and new_st = 'active' and new.partner_user_id = uid then
      null;
    else
      raise exception 'family_sharing_links: status change forbidden';
    end if;
  else
    if old.owner_user_id = uid then
      if old_st = 'pending' then
        if new.partner_tint_color is distinct from old.partner_tint_color
          or new.accepted_at is distinct from old.accepted_at
          or new.partner_combine_in_totals is distinct from old.partner_combine_in_totals
        then
          raise exception 'family_sharing_links: owner pending field forbidden';
        end if;
      elsif old_st = 'active' then
        if new.partner_tint_color is distinct from old.partner_tint_color
          or new.accepted_at is distinct from old.accepted_at
          or new.partner_user_id is distinct from old.partner_user_id
          or new.partner_combine_in_totals is distinct from old.partner_combine_in_totals
        then
          raise exception 'family_sharing_links: owner active field forbidden';
        end if;
      else
        raise exception 'family_sharing_links: owner update forbidden';
      end if;
    elsif old_st = 'active' and new_st = 'active' and (
      old.partner_user_id = uid
      or invitee_email_match
    ) then
      if new.partner_display_color is distinct from old.partner_display_color
        or new.accepted_at is distinct from old.accepted_at
        or new.partner_user_id is distinct from old.partner_user_id
        or new.owner_combine_in_totals is distinct from old.owner_combine_in_totals
      then
        raise exception 'family_sharing_links: partner active field forbidden';
      end if;
    elsif old_st = 'pending' and (
      old.partner_user_id = uid
      or (old.partner_user_id is null and invitee_email_match)
    ) then
      if new.partner_display_color is distinct from old.partner_display_color
        or new.owner_combine_in_totals is distinct from old.owner_combine_in_totals
        or new.partner_combine_in_totals is distinct from old.partner_combine_in_totals
        or new.partner_tint_color is distinct from old.partner_tint_color
      then
        raise exception 'family_sharing_links: pending invitee meta forbidden';
      end if;
    else
      raise exception 'family_sharing_links: update forbidden';
    end if;
  end if;

  return new;
end;
$$;
